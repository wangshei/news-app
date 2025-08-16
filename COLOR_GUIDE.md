# 🎨 Notion Theme Color Guide

## 🚀 **Quick Color Changes**

To change your theme colors, edit **ONLY** these variables in `app/globals.css`:

### **Primary Colors (Brand Identity)**

```css
--primary-blue: #2f76ff; /* Change this for main accent color */
--primary-blue-hover: #1d4ed8; /* Change this for hover states */
```

### **Surface Colors (Backgrounds)**

```css
--surface-primary: #ffffff; /* Change this for main backgrounds */
--surface-secondary: #f7f6f3; /* Change this for secondary areas */
```

### **Text Colors (Typography)**

```css
--text-primary: #37352f; /* Change this for main text */
--text-secondary: #4b5563; /* Change this for secondary text */
```

---

## 📍 **What Each Color Affects**

### **`--primary-blue` (#2f76ff)**

- ✅ Active navigation items ("主页")
- ✅ Button backgrounds
- ✅ Link colors
- ✅ Focus states
- ✅ Accent elements

### **`--primary-blue-hover` (#1d4ed8)**

- ✅ Hover states for buttons
- ✅ Hover states for navigation items
- ✅ Interactive element feedback

### **`--surface-primary` (#ffffff)**

- ✅ Main page background
- ✅ Card backgrounds
- ✅ Modal backgrounds
- ✅ Primary content areas

### **`--surface-secondary` (#f7f6f3)**

- ✅ Sidebar background
- ✅ Secondary card backgrounds
- ✅ Muted content areas
- ✅ Borders and dividers

### **`--text-primary` (#37352f)**

- ✅ Main headings
- ✅ Body text
- ✅ Navigation text
- ✅ Important content

### **`--text-secondary` (#4b5563)**

- ✅ Time labels ("2 小时前")
- ✅ Secondary information
- ✅ Placeholder text
- ✅ Less important content

---

## 🔄 **How to Change Colors**

### **Option 1: Change Primary Brand Color**

```css
/* Change from blue to green */
--primary-blue: #10b981; /* Green accent */
--primary-blue-hover: #059669; /* Darker green hover */
```

### **Option 2: Change Surface Theme**

```css
/* Change to dark theme */
--surface-primary: #1f2937; /* Dark background */
--surface-secondary: #111827; /* Darker secondary */
--text-primary: #f9fafb; /* Light text */
--text-secondary: #d1d5db; /* Light secondary text */
```

### **Option 3: Change Text Colors**

```css
/* Change to high contrast */
--text-primary: #000000; /* Pure black text */
--text-secondary: #374151; /* Dark gray secondary */
```

---

## ⚠️ **Important Notes**

1. **Don't change legacy variables** like `--surface`, `--accent`, etc. - they automatically map to the new system
2. **Test contrast ratios** when changing colors to ensure accessibility
3. **Keep dark mode in sync** - update both light and dark mode sections
4. **Use CSS variables** in components, not hardcoded hex values

---

## 🎯 **Example: Change to Purple Theme**

```css
/* In :root section */
--primary-blue: #8b5cf6; /* Purple accent */
--primary-blue-hover: #7c3aed; /* Darker purple hover */

/* In .dark section */
--primary-blue: #8b5cf6; /* Same purple in dark mode */
--primary-blue-hover: #a78bfa; /* Lighter purple hover */
```

This will automatically update all blue elements to purple throughout your app!
