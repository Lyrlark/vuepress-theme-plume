import type { FSWatcher } from 'chokidar'
import type { App } from 'vuepress'
import type { ThemeBuiltinPlugins, ThemeData } from '../../shared/index.js'
import fs from 'node:fs/promises'
import process from 'node:process'
import { watch } from 'chokidar'
import { resolveImageSize } from 'vuepress-plugin-md-power'
import { hash } from 'vuepress/utils'
import { resolveThemeData } from '../config/resolveThemeData.js'
import { getThemeConfig } from '../loadConfig/index.js'
import { perf, resolveContent, writeTemp } from '../utils/index.js'

let bulletinFileWatcher: FSWatcher | null = null
const bulletinFiles: Record<string, string> = {}

process.on('exit', () => bulletinFileWatcher?.close())

export async function prepareThemeData(
  app: App,
  plugins: ThemeBuiltinPlugins,
): Promise<void> {
  perf.mark('prepare:theme-data')
  const options = getThemeConfig()
  const resolvedThemeData = resolveThemeData(app, options)

  // 用户头像添加尺寸
  await processProfileImageSize(app, resolvedThemeData, plugins)

  if (bulletinFileWatcher) {
    bulletinFileWatcher.close()
    bulletinFileWatcher = null
  }

  await resolveBulletin(app, resolvedThemeData)
  await updateThemeData(app, resolvedThemeData)

  perf.log('prepare:theme-data')
}

async function updateThemeData(app: App, themeData: ThemeData) {
  const content = resolveContent(app, { name: 'themeData', content: themeData })
  await writeTemp(app, 'internal/themePlumeData.js', content)
}

async function resolveBulletin(app: App, themeData: ThemeData) {
  if (themeData.bulletin === true)
    themeData.bulletin = {}

  if (themeData.bulletin)
    themeData.bulletin.id ||= hash(themeData.bulletin)

  if (themeData.bulletin) {
    if (bulletinFiles.root || themeData.bulletin.contentFile) {
      bulletinFiles.root = themeData.bulletin.contentFile || bulletinFiles.root
      delete themeData.bulletin.contentFile
      themeData.bulletin!.content = await readBulletinFile(app, bulletinFiles.root)
    }
    else if (themeData.bulletin.content) {
      const type = themeData.bulletin.contentType ?? 'text'
      themeData.bulletin.content = type === 'markdown'
        ? app.markdown.render(themeData.bulletin.content, {
            filepath: app.dir.source(`/_bulletin.md`),
            filePathRelative: `_bulletin.md`,
          })
        : themeData.bulletin.content
    }
  }

  if (themeData.locales) {
    for (const locale of Object.keys(themeData.locales)) {
      if (themeData.locales[locale].bulletin === true)
        themeData.locales[locale].bulletin = {}

      if (themeData.locales[locale].bulletin)
        themeData.locales[locale].bulletin.id ||= hash(themeData.locales[locale].bulletin)

      if (!themeData.locales[locale].bulletin)
        continue

      if (bulletinFiles[locale] || themeData.locales[locale].bulletin.contentFile) {
        bulletinFiles[locale] = themeData.locales[locale].bulletin?.contentFile || bulletinFiles[locale]
        delete themeData.locales[locale].bulletin.contentFile
        themeData.locales[locale].bulletin.content = await readBulletinFile(app, bulletinFiles[locale], locale)
      }
      else if (themeData.locales[locale].bulletin.content) {
        const type = themeData.locales[locale].bulletin.contentType ?? 'text'
        themeData.locales[locale].bulletin.content = type === 'markdown'
          ? app.markdown.render(themeData.locales[locale].bulletin.content, {
              filepath: app.dir.source(`${locale}_bulletin.md`),
              filePathRelative: `${locale.slice(1)}_bulletin.md`,
            })
          : themeData.locales[locale].bulletin.content
      }
    }
  }
  const files = Array.from(new Set(Object.values(bulletinFiles)))
  if (app.env.isDev && files.length) {
    if (!bulletinFileWatcher) {
      bulletinFileWatcher = watch(files, { ignoreInitial: true })
      bulletinFileWatcher.on('change', async () => {
        await resolveBulletin(app, themeData)
        await updateThemeData(app, themeData)
      })
    }
    else {
      files.forEach(file => bulletinFileWatcher?.add(file))
    }
  }
}

async function readBulletinFile(app: App, filepath: string, locale = '/') {
  try {
    const content = await fs.readFile(filepath, 'utf-8')
    if (filepath.endsWith('.md')) {
      return app.markdown.render(content, {
        filepath: app.dir.source(`${locale}_bulletin.md`),
        filePathRelative: `${locale.slice(1)}_bulletin.md`,
      })
    }
    return content
  }
  catch {}
  return ''
}

async function processProfileImageSize(
  app: App,
  themeData: ThemeData,
  plugins: ThemeBuiltinPlugins,
) {
  const options = getThemeConfig()
  const imageSize = options.markdown?.imageSize
    ?? (typeof plugins.markdownPower === 'boolean' ? false : plugins.markdownPower?.imageSize)

  if (!app.env.isBuild || !imageSize)
    return

  const remote = imageSize === 'all'
  if (themeData.profile?.avatar) {
    const { width, height } = await resolveImageSize(app, themeData.profile.avatar, remote)
    if (width && height) {
      themeData.profile = {
        ...themeData.profile,
        originalWidth: width,
        originalHeight: height,
      } as any
    }
  }
  if (themeData.locales) {
    for (const locale of Object.keys(themeData.locales)) {
      if (themeData.locales[locale].profile?.avatar) {
        const { width, height } = await resolveImageSize(app, themeData.locales[locale].profile.avatar, remote)
        if (width && height) {
          themeData.locales[locale].profile = {
            ...themeData.locales[locale].profile,
            originalWidth: width,
            originalHeight: height,
          } as any
        }
      }
    }
  }
}
