// @ts-nocheck
/* eslint-disable no-redeclare */
/* eslint-disable no-unused-vars */

const clock = document.querySelector('#utility-clock');

utilityClock(clock)
autoResize(clock, 295 + 32)

choose(clock, [
  ['hour', ['text', 'text-quarters', 'pill']],
  ['hour-text', ['large', 'small']],
  ['hour-display', ['all', 'quarters', 'none']],
  ['minute', ['line', 'dot']],
  ['minute-display', ['fine', 'fine-2', 'coarse', 'major', 'none']],
  ['minute-text', ['inside', 'outside', 'none']],
  ['hand', ['normal', 'hollow']]
])

function utilityClock(container) {

  let dynamic = container.querySelector('.dynamic')
  let hourElement = container.querySelector('.hour')
  let minuteElement = container.querySelector('.minute')
  let secondElement = container.querySelector('.second')

  let div = function(className, innerHTML) {
    let element = document.createElement('div')
    element.className = className
    element.innerHTML = innerHTML || ''
    return element
  }

  let append = function(element) {
    return {
      to: function(parent) {
        parent.appendChild(element)
        return append(parent)
      }
    }
  }

  let anchor = function(element, rotation) {
    let anchor = div('anchor')
    rotate(anchor, rotation)
    append(element).to(anchor).to(dynamic)
  }

  let minute = function(n) {
    let klass = n % 5 == 0 ? 'major' : n % 1 == 0 ? 'whole' : 'part'
    let line = div('element minute-line ' + klass)
    anchor(line, n)
    if (n % 5 == 0) {
      let text = div('anchor minute-text ' + klass)
      let content = div('expand content', (n < 10 ? '0' : '') + n)
      append(content).to(text)
      rotate(text, -n)
      anchor(text, n)
    }
  }

  let hour = function(n) {
    let klass = 'hour-item hour-' + n
    let line = div('element hour-pill ' + klass)
    anchor(line, n * 5)
    let text = div('anchor hour-text ' + klass)
    let content = div('expand content', n)
    append(content).to(text)
    rotate(text, -n * 5)
    anchor(text, n * 5)
    return
  }

  let position = function(element, phase, r) {
    let theta = phase * 2 * Math.PI
    element.style.top = (-r * Math.cos(theta)).toFixed(1) + 'px'
    element.style.left = (r * Math.sin(theta)).toFixed(1) + 'px'
  }

  let rotate = function(element, second) {
    element.style.transform = element.style.webkitTransform = 'rotate(' + (second * 6) + 'deg)'
  }

  let animate = function() {
    let now = new Date()
    let time = now.getHours() * 3600 +
                now.getMinutes() * 60 +
                now.getSeconds() * 1 +
                now.getMilliseconds() / 1000
    rotate(secondElement, time)
    rotate(minuteElement, time / 60)
    rotate(hourElement, time / 60 / 12)
    requestAnimationFrame(animate)
  }

  for (let i = 1 / 4; i <= 60; i += 1 / 4) minute(i)
  for (let i = 1; i <= 12; i ++) hour(i)

  animate()

}

function autoResize(element, nativeSize) {
  let update = function() {
    let parent = element.offsetParent
    let scale = Math.min(parent.offsetWidth, parent.offsetHeight) / nativeSize
    element.style.transform = element.style.webkitTransform = 'scale(' + scale.toFixed(3) + ')'
  }
  update()
  window.addEventListener('resize', update)
}

function choose(clock, items) {
  const chooser = document.querySelector('#chooser')

  items.forEach(function(item) {
    let name = item[0]
    let styles = item[1]
    let element = document.createElement('div')
    element.addEventListener('click', click, false)
    update()
    chooser.appendChild(element)
    function update() {
      element.innerHTML = name + '-style-<b>' + getValue() + '</b>'
    }
    function klass(c) {
      return name + '-style-' + c
    }
    function getValue() {
      for (let i = 0; i < styles.length; i ++) {
        if (clock.classList.contains(klass(styles[i]))) return styles[i]
      }
    }
    function click(e) {
      for (let i = 0; i < styles.length; i ++) {
        if (clock.classList.contains(klass(styles[i]))) {
          clock.classList.remove(klass(styles[i]))
          clock.classList.add(klass(styles[(i + 1) % styles.length]))
          break
        }
      }
      update()
      e.preventDefault()
    }
  })
}
