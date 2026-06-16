<script setup>
import { computed } from 'vue'
import { useData } from 'vitepress'

const { page, lang, frontmatter } = useData()

const isZh = computed(() => lang.value.startsWith('zh'))

const dateStr = computed(() => {
  const ts = page.value.lastUpdated
  if (!ts) return ''
  const d = new Date(ts)
  if (isZh.value) return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
})

const author = computed(() => frontmatter.value.lastUpdatedAuthor || '')

const text = computed(() => {
  if (!dateStr.value) return ''
  if (isZh.value) {
    return author.value
      ? `最后由 ${author.value} 于 ${dateStr.value} 更新`
      : `最后更新于 ${dateStr.value}`
  }
  return author.value
    ? `Last updated by ${author.value} on ${dateStr.value}`
    : `Last updated on ${dateStr.value}`
})
</script>

<template>
  <p v-if="text" class="qinh-last-updated">{{ text }}</p>
</template>

<style scoped>
.qinh-last-updated {
  margin: 0;
  padding-top: 16px;
  font-size: 14px;
  font-weight: 500;
  font-style: italic;
  line-height: 24px;
  color: var(--vp-c-text-2);
  text-align: right;
}
</style>
