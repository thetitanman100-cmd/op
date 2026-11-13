# Design system

## World

The interface is an object study built from the visual grammar of the nixie-tube laboratory counter. It should feel measured and quiet: a dark, blackened-metal field, a single transparent glass form, and orange-lit orientation readouts.

## Palette and materials

- Deep charcoal (`#111313`) provides the uninterrupted ground.
- Warm bone (`#eee8dd`) carries readable text.
- Nixie orange (`#f0a347`) is reserved for the live indicator, axis positions, small labels, and highlights.
- The glass model is clear with restrained cool highlights. Do not tint it opaque to make it more visible.
- Use hairline rules to register the fixed readouts against the object.

## Type and composition

- Use a restrained grotesque for headings and explanatory copy, paired with a monospaced face for compact controls and measurements.
- The single rotating object leads; scale the three equal-priority axis readouts beneath or beside it. The counters never compete with the glass.
- Keep composition quiet and spatial, with no cards, decorative technical grids, or secondary glass objects.

## Interaction

- Pointer and touch rotation may turn the object freely through all three axes. The X, Y, and Z registers remain independently adjustable.
- Counter positions are fixed while the object moves. Keep readouts synchronized with the rendered orientation.
- Reset returns the object to its neutral orientation. Keyboard focus and reduced-motion preferences remain supported.

## Responsiveness

- Give the glass the dominant visual area. At narrow widths, place the instrument readouts beneath it without shrinking labels to unreadable sizes.
