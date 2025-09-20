# Snake VS Block (Cocos Creator)

## 📌 Cocos Version
- **Cocos Creator**: 3.8.7  
- Language: TypeScript  

---

## ⚙️ Setup & Build Steps
1. Clone/Extract the project folder.  
2. Open project in **Cocos Creator 3.8.7**.  
3. Run `scene-002.scene` for gameplay.  

### Build (Web/Desktop)
- Go to **Project → Build** → Select **Web Desktop** → Click Build → Run.  

### Build (Android)
- Install **Android Studio**, **SDK (API 30+)**, **NDK**, **JDK 11**.  
- In Cocos Creator → Preferences → External Tools, set paths for SDK/NDK/JDK.  
- Build → Platform: Android → Provide package name (e.g. `com.ansar.snakevsblock`) → Make → Install APK.

---

## 🏗️ Architecture (Brief)
- **GameManager.ts** → Controls game flow (Menu → Play → Game Over → Restart).  
- **Snake.ts** → Snake head movement + trailing body mechanics.  
- **Block.ts** → Block with hit values.  
- **Pickup.ts / PickupValue.ts** → Extra balls to extend snake.  
- **LevelSpawner.ts** → Spawns rows of blocks, pickups, and walls randomly.  
- **UI** → Score labels, Game Over screen, Restart button.  

---

## ⚡ Performance Notes
- Uses **object pooling-like behavior** (destroying old rows as they leave screen).  
- Simple physics handled by distance checks → efficient, no heavy physics engine calls.  
- Optimized for smooth 60 FPS on both desktop and mid-range Android devices.  

---

## 🐞 Known Issues
- On restart, sometimes a ghost ball may appear (fixed in most builds, but could reoccur).  
- Android build requires correct SDK/NDK path setup; otherwise "Target API Level" error appears.  
- Touch controls may feel more sensitive on some screen DPIs.  

---

## 🎨 Asset Credits
- Background: Free starry-sky wallpaper (Unsplash / free to use).  
- Snake, Blocks, Pickups: Custom shapes made in Cocos.  
- Fonts: Free pixel-style fonts.  
- No copyrighted assets used.  

---

## 👨‍💻 Author
- **Ansar Shaik**  
  Roll No: AP22110010088  
  Course: CSE – Software Engineering Internship Assignment  

