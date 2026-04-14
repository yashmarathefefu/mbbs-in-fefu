# MBBS Consultancy Website - FEFU Russia

## Loading Animation Customization Guide

### How to Change Loading Animation Colors

The loading animation uses a shader-based system that you can easily customize. Open `loader.js` and find the **COLOR CUSTOMIZATION** section (around line 50).

#### Pre-made Color Themes

**Current Theme: Blue/Purple (Medical Professional)**
```glsl
#define COLOR_1 vec3(0.2, 0.4, 1.0)  // Blue
#define COLOR_2 vec3(0.6, 0.2, 1.0)  // Purple
#define COLOR_3 vec3(0.0, 0.8, 1.0)  // Cyan
```

**Theme 2: Red/Orange (Energetic)**
```glsl
#define COLOR_1 vec3(1.0, 0.2, 0.2)  // Red
#define COLOR_2 vec3(1.0, 0.5, 0.0)  // Orange
#define COLOR_3 vec3(1.0, 0.8, 0.0)  // Yellow
```

**Theme 3: Green/Teal (Fresh)**
```glsl
#define COLOR_1 vec3(0.0, 1.0, 0.5)  // Green
#define COLOR_2 vec3(0.0, 0.8, 0.8)  // Teal
#define COLOR_3 vec3(0.2, 1.0, 0.8)  // Aqua
```

**Theme 4: Medical/Professional (Clean)**
```glsl
#define COLOR_1 vec3(0.0, 0.6, 1.0)  // Medical Blue
#define COLOR_2 vec3(0.0, 0.9, 0.7)  // Medical Green
#define COLOR_3 vec3(1.0, 1.0, 1.0)  // White
```

#### How to Switch Themes

1. Open `e:/final website/loader.js`
2. Find the `COLOR CUSTOMIZATION` section (line ~50)
3. Comment out the current theme (add `//` before each line)
4. Uncomment your desired theme (remove `//` from each line)
5. Save the file and refresh your browser

#### Create Custom Colors

Colors use RGB format where each value is between 0.0 and 1.0:
- `vec3(1.0, 0.0, 0.0)` = Pure Red
- `vec3(0.0, 1.0, 0.0)` = Pure Green
- `vec3(0.0, 0.0, 1.0)` = Pure Blue
- `vec3(1.0, 1.0, 1.0)` = White
- `vec3(0.0, 0.0, 0.0)` = Black

**Example: Create a pink/purple theme**
```glsl
#define COLOR_1 vec3(1.0, 0.4, 0.8)  // Pink
#define COLOR_2 vec3(0.8, 0.2, 1.0)  // Purple
#define COLOR_3 vec3(1.0, 0.6, 0.9)  // Light Pink
```

### Animation Speed

To change animation speed, modify the `time` multiplier in `loader.js`:

```javascript
// Slower animation
uniforms.time.value += 0.03;  // Default is 0.05

// Faster animation
uniforms.time.value += 0.08;
```

### Loading Duration

To change how long the animation displays:

In `loader.js`, find the `CONFIG` object:
```javascript
const CONFIG = {
    DISPLAY_DURATION: 2000,  // Change this (milliseconds)
    FADE_DURATION: 500,      // Fade out time
    MOBILE_PIXEL_RATIO_CAP: 1.5
};
```

## Project Structure

```
e:/final website/
├── index.html          # Main HTML file
├── styles.css          # Styling
├── script.js           # Main JavaScript
├── loader.js           # Loading animation (customize here!)
└── README.md           # This file
```

## Features

- ✅ Mobile-optimized loading animation
- ✅ Customizable color themes
- ✅ Smooth fade transitions
- ✅ 6 sections: Hero, About FEFU, Programs, Admission, Why Us, Contact
- ✅ Responsive design
- ✅ SEO-optimized structure

## Testing

1. Open `index.html` in your browser
2. Watch the loading animation (2 seconds)
3. See the smooth fade to main website

## Next Steps

- Add FEFU content to each section
- Customize colors to match your brand
- Add images and media
- Deploy to hosting

---

**Need Help?**
- Check `loader.js` for color customization
- All animations are GPU-accelerated for smooth performance
- Works on all modern browsers
