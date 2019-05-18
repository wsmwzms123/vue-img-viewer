const SPECIAL_CHARS_REGEXP = /([:\-_]+(.))/g
const camelCase = name => {
  return name.replace(SPECIAL_CHARS_REGEXP, function (_, separator, letter, offset) {
    return offset ? letter.toUpperCase() : letter
  })
}
const getScrollBarWidth = () => {
  const div = document.createElement('div')
  div.style.width = '100px'
  div.style.overflow = 'scroll'
  div.style.top = '-9999px'
  document.body.appendChild(div)
  const scrollBarWidth = div.offsetWidth - div.clientWidth
  document.body.removeChild(div)
  return scrollBarWidth
}
const createStyles = (zIndex = 2000) => {
  const targetStyleTag =
  const styles = `
    body.img-preview--hideOverflow {
      overflow: hidden;
    }
    body.img-preview-needPaddingBottom {
      padding-bottom: 10px
    }
    .image-view {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: ${zIndex};
      overflow: hidden;
      transition: background-color .2s ease-in-out;
      -webkit-transition: background-color .2s ease-in-out;
    }

    .image-view.is-active {
      background-color: rgba(26,26,26,.65);
    }

    .image-inner {
      height: 100%;
    }
    .image-view-img {
      transition: transform .3s ease-in-out,-webkit-transform .3s ease-in-out;
    }
  `
}

const on = (el, eventName, cb) => {
  el.addEventListener(eventName, cb, false)
}

const sleep = (delay) => {
  return new Promise((resolve) => {
    setTimeout(resolve, delay)
  })
}

const loadElement = (el) => {
  return new Promise((resolve) => {
    on(el, 'load', () => {
      resolve()
    })
  })
}



async function getImageRatio (img)  {
  const { clientWidth: viewportWidth, clientHeight: viewportHeight } = document.documentElement || document.body
  const PADDING_X_OFFSET = 20
  const PADDING_Y_OFFSET = 10
  const image = new Image()

  image.src = img.src
  return new Promise((resolve, reject) => {
    image.onload = () => {
      const { width, height } = image
      const { width: originalWidth, height: originalHeight } = img
      const originalRatio = height / width
      let shownWidth = null
      const finalWidth = (shownWidth = viewportWidth - PADDING_X_OFFSET * 2) < width ? shownWidth : width
      const finalHeight = finalWidth * originalRatio
      const scrollbarWidth = getScrollBarWidth()
      let ifHasOverflowY = false
      let screenOffsetTop = 0
      let viewerHasPaddingBottom = false

      if (finalHeight > viewportHeight) {
        ifHasOverflowY = true
      }
      if (finalHeight + PADDING_Y_OFFSET * 2 > viewportHeight) {
        screenOffsetTop = PADDING_Y_OFFSET
        viewerHasPaddingBottom = true
      } else {
        screenOffsetTop = (viewportHeight - finalHeight) / 2
      }

      const screenOffsetLeft = (Math.abs(viewportWidth - finalWidth) - (ifHasOverflowY ? scrollbarWidth : 0)) / 2
      const offsetLeft = (finalWidth - originalWidth) / 2 + screenOffsetLeft
      const offsetTop = (finalHeight - originalHeight) / 2 + screenOffsetTop
      const bodyHasOverflow = document.documentElement.clientHeight < document.body.scrollHeight
      const bodyOverflowY = document.body.style.overflowY
      let needRemoveScrollbar = false
      let bodyPaddingRight = document.body.style.paddingRight || 0
      let bodyComputedPaddingRight = 0

      if (scrollbarWidth > 0 && (bodyHasOverflow || bodyOverflowY === 'auto')) {
        needRemoveScrollbar = true
      }
      if (needRemoveScrollbar) {
        bodyComputedPaddingRight = parseInt(bodyPaddingRight) + scrollbarWidth + 'px'
      }
      console.log(bodyComputedPaddingRight)
      resolve({
        bodyComputedPaddingRight,
        viewerHasPaddingBottom,
        ratio: finalWidth / originalWidth,
        offsetLeft,
        offsetTop
      })
    }
  })
}

function setStyle (el, styleName, value)  {
  if (typeof styleName === 'object') {
    for (const prop in styleName) {
      setStyle(el, prop, value)
    }
  } else {
    el.style[camelCase(styleName)] = value
  }
}

function getStyle(el, styleName) {
  styleName = camelCase(styleName)
  if (styleName === 'float') {
    styleName = 'cssFloat'
  }
  try {
    const defaultView = document.defaultView.getComputedStyle(el, '')
    return el.style[styleName] || defaultView ? defaultView[styleName] : null
  } catch (error) {
    return el.style[styleName]
  }
}

function getOffsetData(el) {
  const { top, left } = el.getBoundingClientRect()
  return { top, left }
}

function createTagStyle()  {
  const style = document.createElement('style')
  style.innerHTML = createStyles()
  document.head.appendChild(style)
  return style
}

function createDom(elName, attrs, children)  {
  const root = document.createElement(elName || 'div')
  const toString = Object.prototype.toString
  if (toString.call(attrs).slice(8, -1).toLowerCase() !== 'object') {
    children = attrs
    attrs = {}
  }

  for (const prop in attrs) {
    let value = attrs[prop]
    root.setAttribute(prop, value)
  }

  if (children) {
    if (!Array.isArray(children)) {
      children = [children]
    }
    children.forEach(item => {
      if (typeof item === 'string') {
        item = document.createTextNode(item)
      }
      root.appendChild(item)
    })
  }
  return root
}
const getDom = document.querySelector.bind(document)

class ImagePreviewer {
  constructor (options) {
    this.options = options
    this.left = this.top = null
    this.container = this.getContainer()
    this.imageView = getDom('.image-view')
    this.targetImg = getDom('.image-view-img')
    this.domInner = getDom('.image-inner')
  }
  getContainer (src = '') {
    return createDom('div', [
      createDom('div', { class: 'image-view' }, [
        createDom('div', { class: 'image-inner' }, [
          createDom('img', { class: 'image-view-img', src })
        ])
      ])
    ])
  }
}

export default {
  inserted: async function (el, { value = {} }, vnode) {
    await loadElement(el)
    const { nodeName, src, width } = el
    if (
      nodeName.toLowerCase() !== 'img' ||
      !src ||
      (value.max && width < value.max)
    ) return
  }
}
