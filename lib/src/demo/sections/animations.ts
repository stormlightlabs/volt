/**
 * Animations Section
 * Demonstrates surge and shift animation plugins
 */

import * as dom from "../utils";

export function createAnimationsSection(): HTMLElement {
  return dom.article(
    { id: "animations" },
    dom.h2(null, "Animation Demos"),
    dom.section(
      null,
      dom.h3(null, "Surge Plugin: Enter/Leave Transitions"),
      dom.p(
        null,
        "The surge plugin provides smooth transitions when elements appear or disappear.",
        dom.small(
          null,
          "Toggle elements to see fade, slide, scale, and blur transitions. All integrate automatically with data-volt-if and data-volt-show bindings.",
        ),
      ),
      dom.details(
        null,
        dom.summary(null, "Fade"),
        dom.button({ "data-volt-on-click": "showFade.set(!showFade)" }, "Toggle Fade"),
        dom.blockquote({ "data-volt-if": "showFade", "data-volt-surge": "fade" }, "Fades in and out smoothly"),
      ),
      dom.details(
        null,
        dom.summary(null, "Slide Down"),
        dom.button({ "data-volt-on-click": "showSlideDown.set(!showSlideDown)" }, "Toggle Slide"),
        dom.blockquote({ "data-volt-if": "showSlideDown", "data-volt-surge": "slide-down" }, "Slides down from above"),
      ),
      dom.details(
        null,
        dom.summary(null, "Scale"),
        dom.button({ "data-volt-on-click": "showScale.set(!showScale)" }, "Toggle Scale"),
        dom.blockquote({ "data-volt-if": "showScale", "data-volt-surge": "scale" }, "Scales up smoothly"),
      ),
      dom.details(
        null,
        dom.summary(null, "Blur"),
        dom.button({ "data-volt-on-click": "showBlur.set(!showBlur)" }, "Toggle Blur"),
        dom.blockquote({ "data-volt-if": "showBlur", "data-volt-surge": "blur" }, "Blur effect transition"),
      ),
    ),
    dom.section(
      null,
      dom.h3(null, "Custom Timing"),
      dom.p(
        null,
        "Override transition duration and delay using dot notation.",
        dom.small(null, "Syntax: data-volt-surge=\"preset.duration.delay\" (times in milliseconds)"),
      ),
      dom.details(
        null,
        dom.summary(null, "Slow Fade (1000ms)"),
        dom.button({ "data-volt-on-click": "showSlowFade.set(!showSlowFade)" }, "Toggle"),
        dom.blockquote({ "data-volt-if": "showSlowFade", "data-volt-surge": "fade.1000" }, "Very slow fade"),
      ),
      dom.details(
        null,
        dom.summary(null, "Delayed Slide (500ms + 200ms delay)"),
        dom.button({ "data-volt-on-click": "showDelayedSlide.set(!showDelayedSlide)" }, "Toggle"),
        dom.blockquote(
          { "data-volt-if": "showDelayedSlide", "data-volt-surge": "slide-down.500.200" },
          "Slides with delay",
        ),
      ),
    ),
    dom.section(
      null,
      dom.h3(null, "Different Enter/Leave Transitions"),
      dom.p(
        null,
        "Specify different transitions for entering and leaving.",
        dom.small(null, "Use data-volt-surge:enter and data-volt-surge:leave for granular control"),
      ),
      dom.button({ "data-volt-on-click": "showGranular.set(!showGranular)" }, "Toggle Mixed Transition"),
      dom.blockquote({
        "data-volt-if": "showGranular",
        "data-volt-surge:enter": "slide-down.400",
        "data-volt-surge:leave": "fade.200",
      }, "Slides in, fades out"),
    ),
    dom.section(
      null,
      dom.h3(null, "Shift Plugin: Keyframe Animations"),
      dom.p(
        null,
        "The shift plugin applies CSS keyframe animations for attention effects.",
        dom.small(null, "Click buttons to trigger animations. Some run continuously, others on demand."),
      ),
      dom.div(
        { style: "display: flex; gap: 0.5rem; flex-wrap: wrap;" },
        dom.button({
          "data-volt-on-click": "triggerBounce.set(triggerBounce + 1)",
          "data-volt-shift": "triggerBounce:bounce",
        }, "Bounce"),
        dom.button({
          "data-volt-on-click": "triggerShake.set(triggerShake + 1)",
          "data-volt-shift": "triggerShake:shake",
        }, "Shake"),
        dom.button({ "data-volt-shift": "pulse" }, "Pulse (Continuous)"),
        dom.button({
          "data-volt-on-click": "triggerFlash.set(triggerFlash + 1)",
          "data-volt-shift": "triggerFlash:flash",
        }, "Flash"),
      ),
      dom.p(null, "Spinning gear: ", dom.span({ "data-volt-shift": "spin", style: "font-size: 2rem;" }, "⚙️")),
    ),
    dom.section(
      null,
      dom.h3(null, "Custom Animation Settings"),
      dom.p(
        null,
        "Override animation duration and iteration count.",
        dom.small(null, "Syntax: data-volt-shift=\"animation.duration.iterations\""),
      ),
      dom.div(
        { style: "display: flex; gap: 0.5rem; flex-wrap: wrap;" },
        dom.button({
          "data-volt-on-click": "triggerTripleBounce.set(triggerTripleBounce + 1)",
          "data-volt-shift": "triggerTripleBounce:bounce.800.3",
        }, "Triple Bounce (800ms each)"),
        dom.button({
          "data-volt-on-click": "triggerLongShake.set(triggerLongShake + 1)",
          "data-volt-shift": "triggerLongShake:shake.1000.2",
        }, "Long Shake (1000ms, 2x)"),
      ),
    ),
    dom.section(
      null,
      dom.h3(null, "Combined Effects"),
      dom.p(
        null,
        "Surge and shift can be combined for complex animation choreography.",
        dom.small(null, "Toggle to see content that fades in, then bounces on mount"),
      ),
      dom.button({ "data-volt-on-click": "showCombined.set(!showCombined)" }, "Toggle Combined Animation"),
      dom.aside(
        { "data-volt-if": "showCombined", "data-volt-surge": "fade.400", "data-volt-shift": "bounce" },
        dom.p(
          null,
          dom.strong(null, "Animated aside:"),
          " This content fades in smoothly, then bounces when it appears!",
        ),
      ),
    ),
  );
}
