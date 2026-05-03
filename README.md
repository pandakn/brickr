# 🧱 Brickr

> **Turn your photos into LEGO-style pixel art directly in your browser.**

Brickr is a single-page creative playground that converts any image into a LEGO-inspired brick mosaic. Designed with a "physical toy" aesthetic, it prioritizes a premium, tactile user experience without the friction of accounts, dashboards, or server-side processing.

---

## ✨ Features

- **Instant Conversion**: Transform images into brick patterns using advanced LAB color space matching for maximum accuracy.
- **Tactile Controls**: Adjust grid sizes (12x12, 32x32, 64x64) and "messiness" to achieve the perfect look.
- **Dual Render Modes**: Switch between **Flat** (pixel art style) and **Stud** (realistic 3D brick style).
- **Stats & Insights**: Get a full color breakdown, piece counts, and estimated build times for physical builds.
- **Privacy First**: All processing happens client-side via the Canvas API. Your images never leave your machine.
- **Premium Aesthetics**: Built with a custom "Sand & Brick" design system, featuring smooth micro-animations and Aceternity UI effects.

---

## 🛠️ Tech Stack

| Layer             | Choice                                 |
| :---------------- | :------------------------------------- |
| **Framework**     | Next.js 16 (App Router, Static Export) |
| **Language**      | TypeScript (Strict Mode)               |
| **Styling**       | Tailwind CSS v4                        |
| **UI Components** | shadcn/ui                              |
| **Animations**    | Aceternity UI + Framer Motion          |
| **State**         | React hooks + Zustand                  |
| **Processing**    | Canvas API (Client-side)               |

---

## 🚀 Getting Started

### Prerequisites

- Node.js (Latest LTS)
- Bun or npm/pnpm

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your-username/brickr.git
   cd brickr
   ```

2. **Install dependencies**:

   ```bash
   bun install
   # or
   npm install
   ```

3. **Run the development server**:

   ```bash
   bun dev
   # or
   npm run dev
   ```

4. **Open the app**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎨 Design System

Brickr uses a curated color palette and typography to maintain its "toy-box" feel:

- **Typography**: `Nunito` for headings (friendly/rounded) and `Space Mono` for technical data.
- **Palette**: A primary "Sand" foundation (`#F5F0E8`) accented by classic "LEGO" colors (Red, Blue, Yellow, Green).
- **Light-Only**: The app is intentionally designed for light mode to preserve the brand aesthetic.

---

## 📂 Project Structure

- `src/app/`: Root layout and the main single-page application.
- `src/components/canvas/`: Core LEGO rendering engine and stud cell components.
- `src/components/controls/`: Floating panels for grid, messiness, and render settings.
- `src/lib/`: Image processing algorithms, color mapping, and palette definitions.
- `src/hooks/`: State management and canvas interaction logic.
