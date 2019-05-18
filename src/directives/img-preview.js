const SPECIAL_CHARS_REGEXP = /([:\-_]+(.))/g
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
  return `
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
const ifLoaded = (el) => {
  return new Promise((resolve) => {
    on(el, 'load', () => {
      resolve()
    })
  })
}

const camelCase = name => {
  return name.replace(SPECIAL_CHARS_REGEXP, function (_, separator, letter, offset) {
    return offset ? letter.toUpperCase() : letter
  })
}

const getImageRatio = async img => {
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

const setStyle = (el, styleName, value) => {
  if (typeof styleName === 'object') {
    for (const prop in styleName) {
      setStyle(el, prop, value)
    }
  } else {
    el.style[camelCase(styleName)] = value
  }
}
const getStyle = (el, styleName) => {
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

const getOffsetData = (el) => {
  const { top, left } = el.getBoundingClientRect()
  return { top, left }
}

const createTagStyle = () => {
  const style = document.createElement('style')
  style.innerHTML = createStyles()
  document.head.appendChild(style)
  return style
}

const createDom = (elName, attrs, children) => {
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

export default {
  inserted: async function (el, { value = {} }, vnode) {
    await ifLoaded(el)
    const { nodeName, src, width } = el
    if (
      nodeName.toLowerCase() !== 'img' ||
      !src ||
      (value.max && width < value.max)
    ) return

    let left = null
    let top = null
    const initStatus = (imageView) => {
      document.body.classList.remove('img-preview--hideOverflow')
      imageView.classList.remove('img-preview-needPaddingBottom')
      setStyle(document.body, 'padding-right', '')
    }
    const getStyleAttribute = (left, top, ratio = 1) => {
      return `
        width: ${width}px;
        transform: translate3d(${left}px, ${top}px, 0px)
        scale3d(${ratio}, ${ratio}, 1);
      `
    }
    const container = createDom('div', [
      createDom('div', { class: 'image-view' }, [
        createDom('div', { class: 'image-inner' }, [
          createDom('img', { class: 'image-view-img', src })
        ])
      ])
    ])
    const imageView = container.querySelector('.image-view')
    const targetImg = container.querySelector('.image-view-img')
    const domInner = container.querySelector('.image-inner')
    createTagStyle()

    on(container, 'click', function containerEventHandler () {
      if (imageView.classList.contains('is-shrinking')) return
      imageView.classList.add('is-shrinking')
      imageView.classList.remove('is-active')
      const { scrollTop, scrollLeft } = domInner
      targetImg.setAttribute('style',
        getStyleAttribute(left + scrollLeft, top + scrollTop))
    })

    on(targetImg, 'transitionend', function targetImgEventHandler () {
      if (!imageView.classList.contains('is-active')) {
        document.body.removeChild(container)
        imageView.classList.remove('is-shrinking')
        setStyle(domInner, 'overflow', '')
        initStatus(imageView)
      } else {
        setStyle(domInner, 'overflow', 'auto')
      }
    })

    on(el, 'click', async function elEventHandler () {
      const {
        ratio,
        offsetLeft,
        offsetTop,
        viewerHasPaddingBottom,
        bodyComputedPaddingRight
      } = await getImageRatio(el)

      left = getOffsetData(el).left
      top = getOffsetData(el).top
      targetImg.setAttribute('style', getStyleAttribute(left, top))
      if (viewerHasPaddingBottom) {
        imageView.classList.add('img-preview-needPaddingBottom')
      }
      if (bodyComputedPaddingRight) {
        document.body.classList.add('img-preview--hideOverflow')
        setStyle(document.body, 'padding-right', bodyComputedPaddingRight)
      }
      document.body.appendChild(container)
      await sleep()
      imageView.classList.add('is-active')
      targetImg.setAttribute('style', getStyleAttribute(offsetLeft, offsetTop, ratio))
    })
  }
}
