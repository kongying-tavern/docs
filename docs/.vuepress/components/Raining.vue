<script>
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { h, onMounted } from 'vue'

export default {
  name: 'Raining',
  props: {
    content: {
      type: Array,
      // eslint-disable-next-line vue/require-valid-default-prop
      default: ['🐱', '🐶'],
    },
  },
  setup(props) {
    onMounted(() => {
      const stage = document.getElementById('docs-canvas')

      stage.width = window.innerWidth
      stage.height = window.innerHeight
      stage.style.zIndex = '9999999'

      let then, fpsInterval, startTime

      // utilities
      const randItem = (i) => i[Math.floor(Math.random() * i.length)]
      const rand = (i) => Math.floor(Math.random() * i)
      const randBetween = (min, max) =>
        Math.floor(Math.random() * (max - min + 1) + min)

      // config
      const max = 500
      const ctx = stage.getContext('2d')
      const w = stage.width
      const h = stage.height
      const pets = props.content

      // make an array of items
      const items = new Array(max).fill().map((i) => {
        return {
          x: rand(w),
          y: rand(h),
          p: randItem(pets),
          xs: -4 + Math.random() * 4 + 2,
          ys: Math.random() * 10 + 10,
          fs: randBetween(12, 46),
        }
      })

      function draw() {
        ctx.clearRect(0, 0, w, h)
        items.forEach((p) => {
          ctx.font = `${p.fs}px sans-serif`
          ctx.fillText(p.p, p.x, p.y)
        })

        requestAnimationFrame(draw)

        let now = Date.now()
        let elapsed = now - then

        if (elapsed > fpsInterval) {
          then = now - (elapsed % fpsInterval)
        }

        move()
      }

      function move() {
        items.forEach((p) => {
          p.x += p.xs
          p.y += p.ys
          if (p.x > w || p.y > h) {
            p.x = rand(w)
            p.y = -20
          }
        })
      }

      function animate(fps) {
        fpsInterval = 1000 / fps
        then = Date.now()
        startTime = then

        draw()
      }

      animate(60)
    })
    return () => h('canvas', { id: 'docs-canvas' })
  },
}
</script>
