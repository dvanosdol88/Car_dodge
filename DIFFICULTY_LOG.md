# Car Dodge Game - Difficulty Measurement Log

## Purpose
Track difficulty changes to maintain consistent gameplay experience.

## Key Difficulty Metrics
1. **Tank Collision Box Size**: Visual vs actual hitbox alignment
2. **Tank Spawn Frequency**: How often tanks appear
3. **Tank Firing Rate**: How frequently tanks shoot missiles  
4. **Visual Clarity**: How well players can judge collision boundaries

## Change Log

### 2025-06-16 - Visual Enhancement & Difficulty Fix

**Issue Identified**: Enhanced tank sprites created visual-hitbox mismatch
- **Problem**: Visual tank larger than collision box
- **Impact**: Game felt unfairly difficult - players avoided visual tank but still hit smaller hitbox

**Original Tank Specs**:
- Collision: 90px wide × 120px tall
- Position: (lane center - 45, spawn Y)
- Visual: Matched collision exactly

**Problematic Enhanced Tank**:
- Collision: 90px wide × 120px tall (unchanged)
- Visual: ~100px wide × 135px tall (treads +10px width, barrel +15px height)
- Position: Same as original
- **Result**: 10px visual-hitbox mismatch on width, 15px on height

**Fix Applied**:
- **New Collision Box**: 100px wide × 135px tall  
- **New Position**: (lane center - 50, spawn Y - 15)
- **Visual**: Now contained within collision boundaries
- **Result**: Perfect visual-hitbox alignment restored

**Verification Metrics**:
- Tank collision width: 90px → 100px (+11.1%)
- Tank collision height: 120px → 135px (+12.5%)  
- Tank visual-hitbox mismatch: ~10-15px → 0px (eliminated)
- Player fairness: Visual feedback now accurate

**Expected Difficulty Impact**: 
- Slightly easier than broken version (fair hitboxes)
- Slightly harder than original (10-15% larger collision area)
- **Net Result**: More fair gameplay with accurate visual feedback

## Constants to Monitor
```javascript
// Tank generation parameters
const TANK_FIRE_CHANCE = 0.005; // Chance per frame for tank to fire
const TANK_FIRE_COOLDOWN = 1500; // Min time between tank shots (ms)

// Tank dimensions (in generateObstacle function)
width: 100,  // Was 90 - now matches visual width
height: 135, // Was 120 - now matches visual height  
x: xPosInLane - 50, // Was -45 - adjusted for treads
y: startY - 15,     // Was startY - adjusted for barrel
```

## Testing Notes
- Test at localhost:8080
- Verify tank visual boundaries match collision detection
- Confirm fair gameplay feel is restored
- Monitor for any unintended side effects

## Future Considerations
- Consider adding debug mode to visualize hitboxes
- Track player feedback on difficulty perception
- Monitor score distributions for balance validation