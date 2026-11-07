# Feature Spec Template

To create a new feature spec, copy this template:

```bash
# Create feature directory
mkdir -p specs/features/<feature-name>

# Copy templates
cp specs/features/_TEMPLATE_SPEC.md specs/features/<feature-name>/SPEC.md
cp specs/features/_TEMPLATE_ACCEPTANCE.md specs/features/<feature-name>/ACCEPTANCE.md
```

Or use the helper script:
```bash
bash <skill_dir>/scripts/new-feature.sh <project_root> <feature-name>
```
