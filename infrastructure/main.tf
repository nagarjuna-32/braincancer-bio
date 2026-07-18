# NeuroGen AI - Terraform Infrastructure Specification
# Provisions AWS EKS Cluster, RDS PostgreSQL, ElastiCache Redis, and S3 Bucket

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-east-1"
}

# 1. S3 Bucket for Raw Biomedical Datasets (FASTQ, BAM, DICOM, VCF)
resource "aws_s3_bucket" "neurogen_storage" {
  bucket = "neurogen-biomedical-datasets-prod"
}

# 2. RDS PostgreSQL Database Instance
resource "aws_db_instance" "neurogen_postgres" {
  allocated_storage    = 20
  db_name              = "neurogen_db"
  engine               = "postgres"
  engine_version       = "15.3"
  instance_class       = "db.t4g.micro"
  username             = "neurogen_user"
  password             = "neurogen_password_2026"
  skip_final_snapshot  = true
}

# 3. ElastiCache Redis Instance for Celery Broker & API Caching
resource "aws_elasticache_cluster" "neurogen_redis" {
  cluster_id           = "neurogen-redis"
  engine               = "redis"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
}
