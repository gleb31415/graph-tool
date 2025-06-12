# Graph Visualization Tool

A powerful web-based graph visualization tool built with React, Sigma.js, and Firebase. Create, edit, and save interactive node-link diagrams with real-time collaboration features.

## 🚀 Features

- **Interactive Graph Creation**: Add nodes and edges with drag-and-drop functionality
- **Real-time Saving**: Save your graphs to Firebase Realtime Database
- **Multiple Node Shapes**: Support for circles, squares, and triangles
- **File Attachments**: Attach files to nodes for rich content
- **Export/Import**: Export graphs as JSON or ZIP files with attachments
- **Customizable Styling**: Change colors, sizes, and background themes
- **Force Layout**: Apply automatic force-directed layout algorithms

## 🔧 Technologies Used

- **Frontend**: React + Vite
- **Visualization**: Sigma.js + Graphology
- **Backend**: Firebase Realtime Database
- **Deployment**: GitHub Pages with GitHub Actions

## 🌐 Live Demo

Visit the live application: [https://gleb31415.github.io/graph-tool/](https://gleb31415.github.io/graph-tool/)

## 🛠️ Development Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your Firebase configuration
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`

## 📦 Building and Deployment

The project automatically deploys to GitHub Pages via GitHub Actions when changes are pushed to the main branch.

---

*This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.*
