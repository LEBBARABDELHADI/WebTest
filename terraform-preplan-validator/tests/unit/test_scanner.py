from tfpv.scanner import check_project, instances, inventory, load_project, root_var_values


def run(root, env=None, var_files=()):
    p = load_project(root, var_files)
    values, sources = root_var_values(p, {}, env or {})
    findings, passed = check_project(p, values, sources, env or {})
    return p, {(f.rule_id, f.file, f.line) for f in findings}, findings


VARS = 'variable "count_n" {\n  type = number\n}\nvariable "env" {\n  type = string\n}\nvariable "opt" {\n  type    = string\n  default = "x"\n}\n'


def test_missing_values_and_type_mismatch(make_project):
    root = make_project({"variables.tf": VARS, "terraform.tfvars": 'count_n = "three"\nunknown = 1\n'})
    _, keys, findings = run(root)
    assert ("TF_VARIABLE_TYPE_MISMATCH", "terraform.tfvars", 1) in keys
    assert ("TF_MISSING_VARIABLE_VALUE", "variables.tf", 4) in keys
    assert ("TF_UNDECLARED_VARIABLE_VALUE", "terraform.tfvars", 2) in keys
    assert not any(f.attribute == "opt" for f in findings)


def test_env_and_var_files_count_as_values(make_project):
    root = make_project({"variables.tf": VARS, "terraform.tfvars": "count_n = 3\n", "env/prod.tfvars": 'env = "prod"\n'})
    _, keys, findings = run(root, env={"TF_VAR_env": "x"})
    assert not any(k[0] == "TF_MISSING_VARIABLE_VALUE" for k in keys)
    _, keys, findings = run(root)
    miss = [f for f in findings if f.rule_id == "TF_MISSING_VARIABLE_VALUE"]
    assert miss and "env/prod.tfvars" in miss[0].message  # hint: file exists but is not auto-loaded
    _, keys, _ = run(root, var_files=["env/prod.tfvars"])
    assert not any(k[0] == "TF_MISSING_VARIABLE_VALUE" for k in keys)


def test_undeclared_references_without_false_positives(make_project):
    root = make_project({"main.tf": '''
variable "names" { type = list(string) }
locals { tags = { Name = "x" } }
resource "aws_vpc" "main" { cidr_block = "10.0.0.0/16" }
resource "aws_subnet" "s" {
  count      = 2
  vpc_id     = aws_vpc.mian.id
  cidr_block = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  tags       = merge(local.tags, local.missing, { for n in var.names : n => aws_iam_role.r.arn })
}
resource "aws_security_group" "sg" {
  dynamic "ingress_rule" {
    for_each = var.names
    content { description = ingress_rule.value }
  }
  lifecycle { ignore_changes = [tags] }
  depends_on = [aws_vpc.main, module.net]
}
moved {
  from = aws_vpc.old
  to   = aws_vpc.main
}
output "o" { value = path.module }
'''})
    _, keys, findings = run(root)
    values = sorted(f.value for f in findings if f.rule_id == "TF_UNDECLARED_REFERENCE")
    assert values == ["aws_vpc.mian", "local.missing", "module.net"]
    assert all(f.fallback_for == "terraform_validate" for f in findings if f.rule_id == "TF_UNDECLARED_REFERENCE")


def test_modules(make_project):
    root = make_project({
        "main.tf": 'module "a" {\n  source = "./modules/a"\n}\nmodule "ghost" {\n  source = "./nope"\n}\nmodule "reg" {\n  source = "terraform-aws-modules/vpc/aws"\n}\n',
        "modules/a/main.tf": 'variable "name" { type = string }\nvariable "opt" {\n  type    = string\n  default = "x"\n}\n',
    })
    p, keys, findings = run(root)
    assert ("TF_LOCAL_MODULE_NOT_FOUND", "main.tf", 5) in keys
    miss = [f for f in findings if f.rule_id == "TF_MODULE_MISSING_ARGUMENT"]
    assert [f.attribute for f in miss] == ["name"]
    inv = inventory(p, {})
    root_mod = next(m for m in inv["modules"] if m["dir"] == ".")
    assert {c["name"] for c in root_mod["module_calls"]} == {"a", "ghost", "reg"}


def test_cross_module_values(make_project):
    root = make_project({
        "main.tf": 'module "net" {\n  source = "./net"\n  cidr   = "10.1.0.0/16"\n}\n',
        "net/main.tf": 'variable "cidr" { type = string }\nresource "aws_vpc" "v" { cidr_block = var.cidr }\n',
    })
    p = load_project(root)
    values, _ = root_var_values(p, {}, {})
    insts = instances(p, values)
    net = next(i for i in insts if i.prefix == "module.net.")
    assert net.scope.eval_attr(net.module.resources["aws_vpc.v"][0].attributes["cidr_block"]) == "10.1.0.0/16"


def test_syntax_error_is_a_fallback_for_terraform_fmt(make_project):
    root = make_project({"main.tf": 'resource "a" "b" {\n  x = \n}\n'})
    _, _, findings = run(root)
    f = next(f for f in findings if f.rule_id == "TF_SYNTAX_ERROR")
    assert f.fallback_for == "terraform_fmt" and f.line == 2
