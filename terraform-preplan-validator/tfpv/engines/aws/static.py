"""AWS validator — static rules.

Scope, by design: only cross-attribute / cross-resource coherence that TFLint
(AWS ruleset), `terraform validate` and Checkov do not check, and that makes
plan or apply fail. Instance types, deprecated runtimes, encryption, public
exposure, IAM wildcards... are left to those engines (no reinvention).

A rule only fires on values known statically. When a value depends on
something known only at apply time, the evaluation is counted as
"not evaluated" — never as a failure.
"""
from __future__ import annotations

import ipaddress
import json
import re
from dataclasses import dataclass, field
from typing import Any

from ...hcl.expr import UNKNOWN, JsonDoc, ResourceRef, is_known, literal
from ...hcl.parser import Block
from ...models import RawFinding
from ...scanner import ModuleInstance, Project

MISSING = object()
AMI_RE = re.compile(r"^ami-([0-9a-f]{8}|[0-9a-f]{17})$")
SERVICE_PRINCIPAL_RE = re.compile(r"^[a-z0-9][a-z0-9.-]*\.amazonaws\.com(\.cn)?$")
ACCOUNT_RE = re.compile(r"^\d{12}$")
AWS_ARN_PRINCIPAL_RE = re.compile(r"^arn:aws[a-z-]*:(iam|sts)::\d{12}:[A-Za-z0-9+=,.@_/:*-]+$")
FEDERATED_ARN_RE = re.compile(r"^arn:aws[a-z-]*:iam::\d{12}:(saml-provider|oidc-provider)/.+$")
POLICY_ATTRS = {
    "aws_iam_policy": ["policy"], "aws_iam_role": ["assume_role_policy"], "aws_iam_role_policy": ["policy"],
    "aws_iam_user_policy": ["policy"], "aws_iam_group_policy": ["policy"], "aws_s3_bucket_policy": ["policy"],
    "aws_sqs_queue_policy": ["policy"], "aws_sns_topic_policy": ["policy"], "aws_kms_key": ["policy"],
    "aws_ecr_repository_policy": ["policy"], "aws_secretsmanager_secret_policy": ["policy"],
}
NO_IOPS_TYPES = {"gp2", "st1", "sc1", "standard"}
PIOPS_TYPES = {"io1", "io2"}
EBS_MIN_SIZE = {"st1": 125, "sc1": 125, "io1": 4, "io2": 4, "gp2": 1, "gp3": 1, "standard": 1}


@dataclass
class Tally:
    passed: int = 0
    failed: int = 0
    not_evaluated: int = 0
    findings: list[RawFinding] = field(default_factory=list)
    external: dict[str, list[dict[str, Any]]] = field(default_factory=lambda: {"ami": [], "instance_type": [], "rds_engine": []})


def _get(inst: ModuleInstance, block: Block, name: str) -> Any:
    a = block.attributes.get(name)
    if a is None:
        return MISSING
    return inst.scope.eval_attr(a)


def _num(v: Any) -> float | None:
    if isinstance(v, bool) or not isinstance(v, (int, float, str)):
        return None
    try:
        return float(v)
    except ValueError:
        return None


def _line(block: Block, name: str) -> int:
    a = block.attributes.get(name)
    return a.line if a else block.line


class _Rules:
    def __init__(self, project: Project, inst: ModuleInstance, tally: Tally):
        self.project = project
        self.inst = inst
        self.t = tally

    # -- helpers -------------------------------------------------------------
    def items(self, rtype: str):
        for key, (block, rel) in sorted(self.inst.module.resources.items()):
            if key.split(".")[0] == rtype:
                yield key, block, rel

    def addr(self, key: str) -> str:
        return f"{self.inst.prefix}{key}"

    def fail(self, rule_id: str, message: str, rel: str, line: int, key: str, attribute: str | None, value: Any, **extra: Any) -> None:
        self.t.failed += 1
        self.t.findings.append(RawFinding(
            engine="aws", engine_rule=rule_id.lower(), rule_id=rule_id, message=message, file=rel, line=line,
            resource=self.addr(key), attribute=attribute, value=value, extra=extra,
            fallback_for=extra.pop("fallback_for", None)))

    def outcome(self, ok: bool | None) -> None:
        if ok is None:
            self.t.not_evaluated += 1
        elif ok:
            self.t.passed += 1

    # -- network -------------------------------------------------------------
    def cidr(self, value: Any, rel: str, line: int, key: str, attribute: str, v6: bool = False) -> ipaddress._BaseNetwork | None:
        if value is MISSING or value is None:
            return None
        if not isinstance(value, str):
            self.outcome(None)
            return None
        try:
            net = ipaddress.ip_network(value, strict=True)
            if (net.version == 6) != v6:
                raise ValueError("wrong IP version")
            self.outcome(True)
            return net
        except ValueError as e:
            hint = ""
            try:
                n2 = ipaddress.ip_network(value, strict=False)
                hint = f" Did you mean {n2}?"
            except ValueError:
                pass
            self.fail("NET_INVALID_CIDR", f'"{value}" is not a valid IPv{"6" if v6 else "4"} CIDR block ({e}).{hint}', rel, line, key, attribute, value,
                      fallback_for="terraform_validate")
            return None

    def network(self) -> None:
        vpcs: dict[str, dict[str, Any]] = {}
        for key, b, rel in self.items("aws_vpc"):
            if "count" in b.attributes or "for_each" in b.attributes:
                self.outcome(None)
                continue
            v = _get(self.inst, b, "cidr_block")
            entry = {"cidrs": [], "complete": True, "key": key}
            vpcs[self.addr(key)] = entry
            if v is MISSING or not isinstance(v, str):
                entry["complete"] = False  # IPAM pool or unknown
                self.outcome(None)
                continue
            net = self.cidr(v, rel, _line(b, "cidr_block"), key, "cidr_block")
            if net is None:
                entry["complete"] = False
                continue
            entry["cidrs"].append(net)
            ok = 16 <= net.prefixlen <= 28
            if not ok:
                self.fail("NET_VPC_CIDR_SIZE", f"VPC CIDR {net} has a /{net.prefixlen} prefix; AWS accepts /16 to /28.", rel, _line(b, "cidr_block"), key, "cidr_block", v)
            else:
                self.outcome(True)
        for key, b, rel in self.items("aws_vpc_ipv4_cidr_block_association"):
            ref = _get(self.inst, b, "vpc_id")
            v = _get(self.inst, b, "cidr_block")
            target = vpcs.get(ref.address) if isinstance(ref, ResourceRef) and ref.attr == "id" else None
            net = self.cidr(v, rel, _line(b, "cidr_block"), key, "cidr_block") if isinstance(v, str) else None
            if target is not None:
                if net is not None:
                    target["cidrs"].append(net)
                else:
                    target["complete"] = False
            elif isinstance(ref, ResourceRef) or ref is UNKNOWN:
                for t in vpcs.values():  # association to an unknown VPC: be conservative
                    t["complete"] = False
        subnets: list[tuple[str, Block, str, ipaddress.IPv4Network, str | None]] = []
        for key, b, rel in self.items("aws_subnet"):
            if "count" in b.attributes or "for_each" in b.attributes:
                self.outcome(None)
                continue
            v = _get(self.inst, b, "cidr_block")
            if v is MISSING:
                continue
            net = self.cidr(v, rel, _line(b, "cidr_block"), key, "cidr_block")
            if net is None:
                continue
            if not 16 <= net.prefixlen <= 28:
                self.fail("NET_SUBNET_CIDR_SIZE", f"Subnet CIDR {net} has a /{net.prefixlen} prefix; AWS accepts /16 to /28.", rel, _line(b, "cidr_block"), key, "cidr_block", v)
            else:
                self.outcome(True)
            ref = _get(self.inst, b, "vpc_id")
            vpc_addr = ref.address if isinstance(ref, ResourceRef) and ref.attr == "id" else None
            subnets.append((key, b, rel, net, vpc_addr))
            vpc = vpcs.get(vpc_addr) if vpc_addr else None
            if vpc is None or not vpc["complete"] or not vpc["cidrs"]:
                self.outcome(None)
                continue
            if any(net.subnet_of(c) for c in vpc["cidrs"] if c.version == net.version):
                self.outcome(True)
            else:
                blocks = ", ".join(str(c) for c in vpc["cidrs"])
                self.fail("NET_SUBNET_OUTSIDE_VPC", f"Subnet CIDR {net} is not inside the CIDR block(s) of {vpc_addr} ({blocks}).",
                          rel, _line(b, "cidr_block"), key, "cidr_block", str(net), vpc=vpc_addr)
        by_vpc: dict[str, list] = {}
        for s in subnets:
            if s[4]:
                by_vpc.setdefault(s[4], []).append(s)
        for vpc_addr, items in by_vpc.items():
            items.sort(key=lambda s: (s[2], s[1].line))
            for i, (key, b, rel, net, _) in enumerate(items):
                clash = next((o for o in items[:i] if o[3].overlaps(net)), None)
                if clash:
                    self.fail("NET_SUBNET_OVERLAP", f"Subnet CIDR {net} overlaps {self.addr(clash[0])} ({clash[3]}) in {vpc_addr}.",
                              rel, _line(b, "cidr_block"), key, "cidr_block", str(net), other=self.addr(clash[0]))
                elif i:
                    self.outcome(True)

    def security_groups(self) -> None:
        def check_rule(key: str, b: Block, rel: str, owner: Block, proto_attr: str = "protocol") -> None:
            fp, tp, proto = _get(self.inst, b, "from_port"), _get(self.inst, b, "to_port"), _get(self.inst, b, proto_attr)
            for attr in ("cidr_blocks",):
                lst = _get(self.inst, b, attr)
                if isinstance(lst, list):
                    for item in lst:
                        self.cidr(item, rel, _line(b, attr), key, attr)
            lst6 = _get(self.inst, b, "ipv6_cidr_blocks")
            if isinstance(lst6, list):
                for item in lst6:
                    self.cidr(item, rel, _line(b, "ipv6_cidr_blocks"), key, "ipv6_cidr_blocks", v6=True)
            f, t = _num(fp), _num(tp)
            p = str(proto).lower() if isinstance(proto, (str, int)) and not isinstance(proto, bool) else None
            if p is None or f is None or t is None:
                self.outcome(None)
                return
            line = _line(b, "from_port")
            if p in ("-1", "all"):
                if f != 0 or t != 0:
                    self.fail("SG_ALL_PROTOCOL_WITH_PORTS", f'protocol "{proto}" (all traffic) with from_port={int(f)} and to_port={int(t)}: all ports are opened, not the ones written, and the provider expects 0/0.',
                              rel, line, key, "protocol", {"protocol": proto, "from_port": int(f), "to_port": int(t)})
                else:
                    self.outcome(True)
                return
            if p in ("tcp", "udp", "6", "17"):
                if f > t or not (0 <= f <= 65535 and 0 <= t <= 65535):
                    self.fail("SG_PORT_RANGE_INVALID", f"Invalid port range from_port={int(f)} to_port={int(t)} for protocol {proto}.",
                              rel, line, key, "from_port", {"from_port": int(f), "to_port": int(t)})
                else:
                    self.outcome(True)
                return
            self.outcome(True)  # icmp & others: from/to are type/code

        for key, b, rel in self.items("aws_security_group"):
            for child in b.blocks:
                if child.type in ("ingress", "egress"):
                    check_rule(key, child, rel, b)
                elif child.type == "dynamic":
                    self.outcome(None)
        for key, b, rel in self.items("aws_security_group_rule"):
            check_rule(key, b, rel, b)
        for rtype in ("aws_vpc_security_group_ingress_rule", "aws_vpc_security_group_egress_rule"):
            for key, b, rel in self.items(rtype):
                self.cidr(_get(self.inst, b, "cidr_ipv4"), rel, _line(b, "cidr_ipv4"), key, "cidr_ipv4")
                self.cidr(_get(self.inst, b, "cidr_ipv6"), rel, _line(b, "cidr_ipv6"), key, "cidr_ipv6", v6=True)
                proto = _get(self.inst, b, "ip_protocol")
                if isinstance(proto, str) and proto.lower() in ("tcp", "udp", "6", "17"):
                    f, t = _num(_get(self.inst, b, "from_port")), _num(_get(self.inst, b, "to_port"))
                    if f is not None and t is not None and (f > t or not (0 <= f <= 65535 and 0 <= t <= 65535)):
                        self.fail("SG_PORT_RANGE_INVALID", f"Invalid port range from_port={int(f)} to_port={int(t)}.", rel, _line(b, "from_port"), key, "from_port",
                                  {"from_port": int(f), "to_port": int(t)})
                    else:
                        self.outcome(True if f is not None and t is not None else None)

    # -- storage ---------------------------------------------------------------
    def _ebs(self, key: str, b: Block, rel: str, type_attr: str, size_attr: str, standalone: bool) -> None:
        vtype = _get(self.inst, b, type_attr)
        if not isinstance(vtype, str):
            self.outcome(None)
            return
        vtype = vtype.lower()
        iops = _get(self.inst, b, "iops")
        thr = _get(self.inst, b, "throughput")
        size = _num(_get(self.inst, b, size_attr))
        sev = {} if standalone else {"severity": "MEDIUM", "fails_at": "apply", "confidence": "medium"}
        if vtype in NO_IOPS_TYPES and iops is not MISSING and iops is not None:
            self.fail("EBS_IOPS_NOT_SUPPORTED", f'iops is set but volume type "{vtype}" does not support provisioned IOPS.', rel, _line(b, "iops"), key, "iops",
                      iops if is_known(iops) else None, **sev)
        else:
            self.outcome(True)
        if vtype in PIOPS_TYPES and (iops is MISSING or iops is None):
            self.fail("EBS_IOPS_REQUIRED", f'Volume type "{vtype}" requires iops.', rel, _line(b, type_attr), key, "iops", None,
                      **({} if standalone else {"fails_at": "apply"}))
        else:
            self.outcome(True)
        if thr is not MISSING and thr is not None and vtype != "gp3":
            self.fail("EBS_THROUGHPUT_NOT_SUPPORTED", f'throughput is only supported on gp3 volumes (type is "{vtype}").', rel, _line(b, "throughput"), key, "throughput",
                      thr if is_known(thr) else None, **sev)
        else:
            self.outcome(True)
        minimum = EBS_MIN_SIZE.get(vtype)
        if minimum is not None and size is not None:
            if size < minimum:
                self.fail("EBS_SIZE_BELOW_MINIMUM", f'Volume size {int(size)} GiB is below the {minimum} GiB minimum for "{vtype}".', rel, _line(b, size_attr), key, size_attr, int(size))
            else:
                self.outcome(True)
        else:
            self.outcome(None)

    def storage(self) -> None:
        for key, b, rel in self.items("aws_ebs_volume"):
            self._ebs(key, b, rel, "type", "size", standalone=True)
        for rtype in ("aws_instance", "aws_spot_instance_request"):
            for key, b, rel in self.items(rtype):
                for child in b.blocks:
                    if child.type in ("root_block_device", "ebs_block_device") and "volume_type" in child.attributes:
                        self._ebs(key, child, rel, "volume_type", "volume_size", standalone=False)
        for rtype in ("aws_launch_template",):
            for key, b, rel in self.items(rtype):
                for bdm in b.children("block_device_mappings"):
                    for ebs in bdm.children("ebs"):
                        if "volume_type" in ebs.attributes:
                            self._ebs(key, ebs, rel, "volume_type", "volume_size", standalone=False)

    # -- databases -------------------------------------------------------------
    def databases(self) -> None:
        for key, b, rel in self.items("aws_db_instance"):
            engine = _get(self.inst, b, "engine")
            alloc, maxs = _num(_get(self.inst, b, "allocated_storage")), _num(_get(self.inst, b, "max_allocated_storage"))
            stype = _get(self.inst, b, "storage_type")
            iops = _get(self.inst, b, "iops")
            if alloc is not None and maxs is not None and maxs > 0:
                if maxs < alloc:
                    self.fail("RDS_MAX_STORAGE_BELOW_ALLOCATED", f"max_allocated_storage ({int(maxs)}) is lower than allocated_storage ({int(alloc)}).",
                              rel, _line(b, "max_allocated_storage"), key, "max_allocated_storage", int(maxs))
                else:
                    self.outcome(True)
            elif "max_allocated_storage" in b.attributes:
                self.outcome(None)
            if isinstance(stype, str):
                st = stype.lower()
                if st in ("gp2", "standard") and iops is not MISSING and iops is not None:
                    self.fail("RDS_IOPS_STORAGE_TYPE_CONFLICT", f'iops is set but storage_type "{st}" does not support provisioned IOPS.', rel, _line(b, "iops"), key, "iops",
                              iops if is_known(iops) else None)
                elif st in PIOPS_TYPES and (iops is MISSING or iops is None):
                    self.fail("RDS_IOPS_STORAGE_TYPE_CONFLICT", f'storage_type "{st}" requires iops.', rel, _line(b, "storage_type"), key, "iops", None)
                else:
                    self.outcome(True)
            else:
                self.outcome(None if "storage_type" in b.attributes else True)
            multi_az = _get(self.inst, b, "multi_az")
            az = b.attributes.get("availability_zone")
            if multi_az is True and az is not None:
                self.fail("RDS_MULTI_AZ_WITH_AZ", "multi_az = true cannot be combined with availability_zone.", rel, az.line, key, "availability_zone",
                          literal(az.tokens) if is_known(literal(az.tokens)) else None)
            else:
                self.outcome(True if multi_az is not UNKNOWN else None)
            if isinstance(engine, str) and engine.startswith("aurora") and "cluster_identifier" not in b.attributes:
                self.fail("RDS_AURORA_ENGINE_ON_INSTANCE", f'Engine "{engine}" requires an aws_rds_cluster (cluster_identifier is not set).', rel, _line(b, "engine"), key, "engine", engine)
            elif isinstance(engine, str):
                self.outcome(True)
            restored = any(a in b.attributes for a in ("replicate_source_db", "snapshot_identifier", "restore_to_point_in_time", "s3_import"))
            if isinstance(engine, str) and not engine.startswith("aurora") and alloc is not None and not restored:
                st = stype.lower() if isinstance(stype, str) else ("io1" if iops is not MISSING and iops is not None else "gp2")
                minimum = 100 if st in PIOPS_TYPES else 20 if st in ("gp2", "gp3") else None
                if minimum and alloc < minimum:
                    self.fail("RDS_STORAGE_BELOW_MINIMUM", f"allocated_storage {int(alloc)} GiB is below the usual {minimum} GiB minimum for {st} storage.",
                              rel, _line(b, "allocated_storage"), key, "allocated_storage", int(alloc))
                elif minimum:
                    self.outcome(True)
            if isinstance(engine, str) and "engine_version" in b.attributes:
                ver = _get(self.inst, b, "engine_version")
                if isinstance(ver, str):
                    self.t.external["rds_engine"].append({"key": key, "address": self.addr(key), "file": rel, "line": _line(b, "engine_version"),
                                                          "engine": engine, "version": ver, "provider": _provider_alias(b)})

    # -- IAM -----------------------------------------------------------------------
    def _principals(self, principal: Any, rel: str, line: int, key: str, attribute: str) -> None:
        if principal is UNKNOWN or principal is None:
            self.outcome(None)
            return
        if principal == "*":
            self.outcome(True)
            return
        if not isinstance(principal, dict):
            self.outcome(None)
            return
        for ptype, ids in principal.items():
            for pid in ids if isinstance(ids, list) else [ids]:
                if not isinstance(pid, str):
                    self.outcome(None)
                    continue
                bad = None
                if ptype == "Service" and not SERVICE_PRINCIPAL_RE.match(pid):
                    bad = f'"{pid}" is not a valid service principal' + (' (did you mean "' + pid.replace(".amazon.com", ".amazonaws.com") + '"?)' if pid.endswith(".amazon.com") else " (expected <service>.amazonaws.com)")
                elif ptype == "AWS" and not (pid == "*" or ACCOUNT_RE.match(pid) or AWS_ARN_PRINCIPAL_RE.match(pid)):
                    bad = f'"{pid}" is not a valid AWS principal (expected a 12-digit account ID, an IAM/STS ARN or "*")'
                elif ptype == "Federated" and pid.startswith("arn:") and not FEDERATED_ARN_RE.match(pid):
                    bad = f'"{pid}" is not a valid federated principal ARN'
                if bad:
                    self.fail("IAM_INVALID_PRINCIPAL", bad + ".", rel, line, key, attribute, pid)
                else:
                    self.outcome(True)

    def _policy_doc(self, doc: Any, rel: str, line: int, key: str, attribute: str) -> None:
        if not isinstance(doc, dict):
            self.outcome(None)
            return
        stmts = doc.get("Statement")
        stmts = stmts if isinstance(stmts, list) else [stmts] if isinstance(stmts, dict) else []
        for st in stmts:
            if isinstance(st, dict):
                for pkey in ("Principal", "NotPrincipal"):
                    if pkey in st:
                        self._principals(st[pkey], rel, line, key, attribute)

    def iam(self) -> None:
        for rtype, attrs in POLICY_ATTRS.items():
            for key, b, rel in self.items(rtype):
                targets = [(b, a) for a in attrs] + [(c, "policy") for c in b.children("inline_policy")]
                for blk, attr in targets:
                    v = _get(self.inst, blk, attr)
                    if v is MISSING or v is None:
                        continue
                    line = _line(blk, attr)
                    if isinstance(v, ResourceRef) and v.attr == "json" and ".aws_iam_policy_document." in f".{v.address}":
                        continue  # checked through the aws_iam_policy_document data source below
                    if isinstance(v, JsonDoc):
                        self._policy_doc(v.value, rel, line, key, attr)
                    elif isinstance(v, str):
                        try:
                            doc = json.loads(v)
                        except ValueError as e:
                            self.fail("IAM_POLICY_INVALID_JSON", f"{attr} is not valid JSON: {e.msg} (line {e.lineno} of the document).", rel, line, key, attr, None,
                                      fallback_for="terraform_validate")
                            continue
                        self.outcome(True)
                        self._policy_doc(doc, rel, line, key, attr)
                    else:
                        self.outcome(None)
        for key, (b, rel) in sorted(self.inst.module.data.items()):
            if key.split(".")[0] != "aws_iam_policy_document":
                continue
            for st in b.children("statement"):
                for pblock in st.children("principals") + st.children("not_principals"):
                    ptype = _get(self.inst, pblock, "type")
                    ids = _get(self.inst, pblock, "identifiers")
                    if isinstance(ptype, str) and isinstance(ids, list):
                        self._principals({ptype: ids}, rel, _line(pblock, "identifiers"), f"data.{key}", "identifiers")
                    else:
                        self.outcome(None)

    # -- EC2 -----------------------------------------------------------------------
    def ec2(self) -> None:
        for rtype, attr in (("aws_instance", "ami"), ("aws_spot_instance_request", "ami"), ("aws_launch_template", "image_id"), ("aws_launch_configuration", "image_id")):
            for key, b, rel in self.items(rtype):
                v = _get(self.inst, b, attr)
                if v is MISSING:
                    continue
                if not isinstance(v, str):
                    self.outcome(None)
                    continue
                if v.startswith("resolve:ssm:"):
                    self.outcome(True)
                    continue
                if AMI_RE.match(v):
                    self.outcome(True)
                    self.t.external["ami"].append({"key": key, "address": self.addr(key), "file": rel, "line": _line(b, attr), "ami": v, "provider": _provider_alias(b)})
                else:
                    self.fail("EC2_AMI_ID_MALFORMED", f'"{v}" is not a valid AMI ID (expected ami- followed by 8 or 17 hex characters).', rel, _line(b, attr), key, attr, v)
            for key, b, rel in self.items(rtype):
                it = _get(self.inst, b, "instance_type")
                if isinstance(it, str):
                    self.t.external["instance_type"].append({"key": key, "address": self.addr(key), "file": rel, "line": _line(b, "instance_type"),
                                                             "instance_type": it, "provider": _provider_alias(b)})


def _provider_alias(b: Block) -> str | None:
    a = b.attributes.get("provider")
    if a is None:
        return None
    toks = [t.value for t in a.tokens]
    if len(toks) == 3 and toks[1] == ".":
        return toks[2]
    return None


def run(project: Project, insts: list[ModuleInstance]) -> Tally:
    tally = Tally()
    for inst in insts:
        r = _Rules(project, inst, tally)
        r.network()
        r.security_groups()
        r.storage()
        r.databases()
        r.iam()
        r.ec2()
    # The same file can be evaluated through several module instances: keep one
    # finding per (rule, file, line, value).
    seen = set()
    unique = []
    for f in tally.findings:
        k = (f.rule_id, f.file, f.line, json.dumps(f.value, sort_keys=True, default=str))
        if k not in seen:
            seen.add(k)
            unique.append(f)
    tally.failed -= len(tally.findings) - len(unique)
    tally.findings = unique
    return tally
