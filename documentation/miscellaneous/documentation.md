---
title: Documentation
description: Linting the documentations source files
---

This documetation is based on markdown files that are stored in each components source code repository. We use a linter to ensure a high standard.

# Tool

Remark is used to lint and autofix the markdown files.
- [github.com/wooorm/remark](https://github.com/wooorm/remark)
- [github.com/wooorm/remark-lint](https://github.com/wooorm/remark-lint)

# Installation

```
npm install --global remark remark-lint
```

# Configration

- `/documentation/.remarkrc`

## Linting

A full list of available rules are available [here](https://github.com/wooorm/remark-lint/blob/master/doc/rules.md)

## Transformation

A full list of options are available [here](https://github.com/wooorm/remark#api)

# Use


First of all navigate to the documentations directory.

```bash
cd documentation
```

## lint

**single file**

```bash
remark documentation/miscellaneous/documentation.md
```

**all files**

```bash
remark .
```

## autofix

**single file**

```bash
remark documentation/miscellaneous/documentation.md -o .
```

**all files**

```bash
remark . -o .
```
