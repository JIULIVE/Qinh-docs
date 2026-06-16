import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import './custom.css'
import LastUpdated from './LastUpdated.vue'

export default {
  extends: DefaultTheme,
  Layout() {
    // 在正文页脚（上一篇/下一篇之前）渲染「最后由 X 于 Y 更新」。
    return h(DefaultTheme.Layout, null, {
      'doc-footer-before': () => h(LastUpdated),
    })
  },
}
