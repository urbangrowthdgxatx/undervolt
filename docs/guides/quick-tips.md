# Quick Tips

## 📸 Take Screenshots

```bash
# Interactive selection (click and drag)
gnome-screenshot -a -f screenshot.png

# Full screen
gnome-screenshot -f screenshot.png

# Current window
gnome-screenshot -w -f screenshot.png

# With delay (5 seconds)
gnome-screenshot -d 5 -f screenshot.png
```

Screenshots save to current directory by default.

## 🖱️ Fix Magic Mouse Scrolling

If Magic Mouse isn't scrolling smoothly:

```bash
# Check if mouse is detected
xinput list

# Find your mouse ID (look for "Magic Mouse")
# Then adjust scroll speed:
xinput set-prop <DEVICE_ID> "libinput Scrolling Pixel Distance" 15

# Make natural scrolling (Mac-style):
xinput set-prop <DEVICE_ID> "libinput Natural Scrolling Enabled" 1
```

Or install `gnome-tweaks`:
```bash
sudo apt install gnome-tweaks
gnome-tweaks
# Then: Keyboard & Mouse → Mouse → Scroll Direction
```

## ⚡ Speed Up LLM

### Option 1: Use Fast Analytics Mode (Instant)
Change endpoint in code from `/api/chat-llm` to `/api/chat-analytics`

### Option 2: Use Smaller Model
```bash
ollama pull llama3.2:1b  # 1B model = 2x faster
```

Update `.env.local`:
```
VLLM_MODEL_NAME=llama3.2:1b
```

### Option 3: Enable GPU Acceleration
Ollama should auto-detect Jetson GPU, but you can force it:
```bash
# Check Ollama is using GPU
ollama show llama3.2:3b --modelfile

# If not using GPU, reinstall Ollama for Jetson:
curl -fsSL https://ollama.com/install.sh | sh
```

## 🎨 UI Button Improvements

The suggestion buttons could use:
- Better hover states (already has hover:bg-white/10)
- Icon consistency (emoji vs lucide icons)
- Visual affordance (add arrow or chevron)
- Click feedback animation

Let me know if you want me to polish the button styling!
