terraform {
  required_version = ">= 1.6"
}

module "ghost" {
  source = "./modules/does-not-exist"
}
