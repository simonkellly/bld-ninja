# BLD Ninja

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/simonkellly/bld-ninja/pages.yml?style=for-the-badge)
![GitHub Last Commit](https://img.shields.io/github/last-commit/simonkellly/bld-ninja?style=for-the-badge)
![GitHub License](https://img.shields.io/github/license/simonkellly/bld-ninja?style=for-the-badge)


![BLD Ninja logo](https://simonkellly.github.io/bld-ninja/bldninja-logo-v1.svg)

This is a work in progress 3BLD trainer. It is designed to be used with a smart cube to analyse solves and identify places to improve.
This is a more fully featured replacement for my previous trainer [BLD Tools](https://github.com/simonkellly/bld-tools).

Check it out [here](https://simonkellly.github.io/bld-ninja/)

<details open>
  <summary>Screenshots</summary>

  ![Screenshot](https://simonkellly.github.io/bld-ninja/screenshot.jpeg)
</details>

## Planned features

- [ ] Standard timer functionality
- [ ] DNF Analysis
- [ ] In solve case timing
- [ ] Algsheet importing and generation
- [ ] Reconstruction export

I can only really guarantee support the GAN 356i Carry 2 as I have one which I can use to test with.

Theoretically the supported smart cubes (thanks to the [gan-web-bluetooth](https://github.com/afedotov/gan-web-bluetooth) library) are:
- GAN Mini ui FreePlay
- GAN12 ui
- GAN12 ui FreePlay
- GAN356 i 3
- GAN356 i Carry
- GAN356 i Carry 2
- GAN356 i Carry S
- MoYu AI 2023
- Monster Go 3Ai

## Development

This project is built with the [Bun](https://bun.sh) javascript runtime.

![Bun Badge](https://img.shields.io/badge/Bun-000000.svg?style=for-the-badge&logo=Bun&logoColor=white)
![Vite Badge](https://img.shields.io/badge/Vite-646CFF.svg?style=for-the-badge&logo=Vite&logoColor=white)
![Typescript Badge](https://img.shields.io/badge/TypeScript-3178C6.svg?style=for-the-badge&logo=TypeScript&logoColor=white)
![React Badge](https://img.shields.io/badge/React-61DAFB.svg?style=for-the-badge&logo=React&logoColor=black)
![Bluetooth Badge](https://img.shields.io/badge/Bluetooth-0082FC.svg?style=for-the-badge&logo=Bluetooth&logoColor=white)
![Tailwind Badge](https://img.shields.io/badge/Tailwind%20CSS-06B6D4.svg?style=for-the-badge&logo=Tailwind-CSS&logoColor=white)

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run dev
```

To run tests:

```bash
bun test
```