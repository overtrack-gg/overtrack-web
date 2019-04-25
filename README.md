<h1 align="center"> OverTrack (WebUI) </h1> <br>
<p align="center">
  <a href="https://overtrack.gg/">
    <img alt="OverTrack" title="OverTrack" src="https://i.imgur.com/ieCUuC0.png" width="450">
  </a>
</p>

<p align="center">
  Be a better overwatch player.
</p>

<p align="center">
  <a href="https://overtrack-client.s3.amazonaws.com/overtrack.exe">
    <img alt="Download the Tracker" title="Download Tracker" src="https://i.imgur.com/UcmKMW4.png" width="250">
  </a>
</p>

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Feedback](#feedback)
- [Contributors](#contributors)
- [Build Process](#build-process)
  * [Installation](#installation)
  * [Development server](#development-server)
  * [Build](#build)
- [Support us](#support-us)

## Introduction

[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg?style=flat-square)](#contributors)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Discord chat](https://img.shields.io/badge/chat-on_discord-008080.svg?style=flat-square)](https://discord.gg/JywstAB)

This repo is for the WebUI of [OverTrack](https://overtrack.gg), a service built on computer vision that allows you to get post-game stats of your competitive Overwatch games. 

<p align="center">
  <img src = "https://i.imgur.com/LTnunLN.png" width=350>
</p>

## Features

**Note:** This repo is to build a WebUI for OverTrack, while you can run this locally on your own server, this is largely intended for public development for the official Overtrack website.

* Keep track of SR
* View what heroes you are stronger with
* Match Killfeed
* Ultimate building and usage.


## Feedback

Feel free to discuss ideas and development on [Discord](https://discord.gg/JywstAB) or [file an issue](https://github.com/synap5e/overtrack-web/issues/new). Feature requests are always welcome. If you wish to contribute, please take a quick look at the [guidelines](./CONTRIBUTING.md)!

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table><tr><td align="center"><a href="https://benolot.com"><img src="https://avatars2.githubusercontent.com/u/2461562?v=4" width="100px;" alt="Sam Fry"/><br /><sub><b>Sam Fry</b></sub></a><br /><a href="https://github.com/synap5e/overtrack-web/commits?author=benolot" title="Code">💻</a> <a href="#design-benolot" title="Design">🎨</a></td><td align="center"><a href="https://github.com/JWSenteney"><img src="https://avatars0.githubusercontent.com/u/1554771?v=4" width="100px;" alt="JWSenteney"/><br /><sub><b>JWSenteney</b></sub></a><br /><a href="#design-JWSenteney" title="Design">🎨</a></td></tr></table>

<!-- ALL-CONTRIBUTORS-LIST:END -->
This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification and is brought to you by these [awesome contributors](./CONTRIBUTORS.md).

## Build Process

### Installation

After cloning, install the dependencies using npm.

```bash
npm install
npm install -g @angular/cli
```

### Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

Running `ng serve --open` will additionally open the webpage in the default browser.

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Support us

If you like OverTrack, consider becoming a [subscriber](https://overtrack.gg/subscribe). 
