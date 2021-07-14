<template>
  <svg height="200" width="200">
    <defs>
      <filter id="distortionFilter">
        <feTurbulence
          id="turbolence"
          type="fractalNoise"
          baseFrequency="5"
          numOctaves="10"
          seed="10"
          stitchTiles="noStitch"
          x="0%"
          y="0%"
          :width="size"
          :height="size"
          result="noise"
        ></feTurbulence>
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale="50"
          xChannelSelector="R"
          yChannelSelector="B"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          filterUnits="userSpaceOnUse"
        ></feDisplacementMap>
        <animate
          xlink:href="#turbolence"
          attributeName="baseFrequency"
          dur="20s"
          keyTimes="0;0.5;1"
          values="5;5.1;5;"
          repeatCount="indefinite"
        ></animate>
      </filter>
    </defs>
    <circle
      cx="100"
      cy="100"
      r="70"
      :fill="color"
      filter="url(#distortionFilter)"
    ></circle>
  </svg>
</template>

<script>
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'ShunyaKoide',
  props: {
    size: {
      type: Number,
      default: 200,
    },
    color: {
      type: String,
      default: '#416253',
    },
  },
})
</script>
