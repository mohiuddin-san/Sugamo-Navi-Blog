/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin'

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./routes/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xsm': '320px',
        'sm': '480px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1440px',
      },
      colors: {
        'main': '#3f3f3f',
        'brand-red': '#e74c3c',
        'brand-blue': '#3498db',
        'brand-green': '#2ecc71',
        'brand-gold': '#a99f3c',
        'media': '#a7cbd6',
        'text-number': '#e59d5c',
        'text-light': '#666666',
      },
      fontFamily: {
        sawarabi: ["'Sawarabi Gothic'", "sans-serif"],
        cairo: ["'Cairo'", "sans-serif"],
        courierPrime: ["'Courier Prime'", "monospace"],
        courier: ["Courier", "monospace"],
        cousine: ["Cousine", "monospace"]
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities, addComponents, theme }) {
      // 1. ユーティリティクラス（mixin的な使い方）
      const utilities = {
        '.flex-center': {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        '.button-reset': {
          background: 'none',
          border: 'none',
          padding: '0',
          margin: '0',
          cursor: 'pointer',
          outline: 'none',
        },
        '.pc-only': {
          display: 'none',
          '@media (min-width: 768px)': {
            display: 'block',
          },
        },
        '.sp-only': {
          display: 'block',
          '@media (min-width: 768px)': {
            display: 'none',
          },
        },
      }

      // 2. レスポンシブフォントサイズ（改善版fs/fsm/fs-vw関数の実装）

      // fs関数: PC-タブレット間のレスポンシブサイズ（Figmaデザイン対応）
      // 基準: 1440px（Figma PCデザイン）→ 768px（タブレット）
      // 使用例: class="fs-20" (1440pxで20px, デフォルト縮小率0.75)
      //        class="fs-20-60" (1440pxで20px, 縮小率0.6)
      const createFsUtility = (maxSize, ratio = 0.75) => {
        const minVw = 768   // タブレット最小幅
        const baseVw = 1440 // Figma PCデザイン基準幅
        const minSize = maxSize * ratio

        return {
          fontSize: `calc(${minSize}px + ${maxSize - minSize} * ((100vw - ${minVw}px) / ${baseVw - minVw}))`
        }
      }

      // fs-vw関数: 画面幅完全一致版（グリッドレイアウト用）
      // 1440px基準で常に画面幅の正確な比率を維持
      // 使用例: class="w-fs-vw-536" (1440pxで536px = 37.222vw)
      const createFsVwUtility = (designSize) => {
        const vwValue = (designSize / 1440) * 100
        return `${vwValue}vw`
      }

      const createFsmUtility = (size480, ratio320 = 0.67, ratio767 = 1.2) => {
        const minVw = 480
        const maxVw = 767
        const size320 = size480 * ratio320  // 320px width
        const size767 = size480 * ratio767  // 767px width
        return {
          fontSize: `calc(${size320}px + ${size767 - size320} * ((100vw - ${minVw}px) / ${maxVw - minVw}))`
        }
      }
      const createSmallViewFsmUtility = (size480, ratio320 = 0.37, ratio767 = 1.2) => {
        const minVw = 480
        const maxVw = 767
        const size320 = size480 * ratio320  // 320px width
        const size767 = size480 * ratio767  // 767px width
        return {
          fontSize: `calc(${size320}px + ${size767 - size320} * ((100vw - ${minVw}px) / ${maxVw - minVw}))`
        }
      }


      // よく使うサイズのプリセット
      const fsUtilities = {}
      const fsmUtilities = {}
      const fsVwUtilities = {}

      // fs関数のプリセット（デフォルト縮小率0.75）
      const fsSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80]
      fsSizes.forEach(size => {
        fsUtilities[`.fs-${size}`] = createFsUtility(size)
        // カスタム縮小率版も追加（50%, 60%, 70%, 80%, 90%）
        fsUtilities[`.fs-${size}-50`] = createFsUtility(size, 0.5)
        fsUtilities[`.fs-${size}-60`] = createFsUtility(size, 0.6)
        fsUtilities[`.fs-${size}-70`] = createFsUtility(size, 0.7)
        fsUtilities[`.fs-${size}-80`] = createFsUtility(size, 0.8)
        fsUtilities[`.fs-${size}-90`] = createFsUtility(size, 0.9)
      })

      // fs-vw関数のプリセット（グリッド用の一般的なサイズ）
      const fsVwSizes = [76, 100, 120, 216, 280,244, 360, 480, 536, 640, 720, 960, 1200, 1440]
      fsVwSizes.forEach(size => {
        // widthユーティリティ
        fsVwUtilities[`.w-fs-vw-${size}`] = {
          width: createFsVwUtility(size)
        }
        // heightユーティリティ
        fsVwUtilities[`.h-fs-vw-${size}`] = {
          height: createFsVwUtility(size)
        }
        // gapユーティリティ
        fsVwUtilities[`.gap-fs-vw-${size}`] = {
          gap: createFsVwUtility(size)
        }
        // paddingユーティリティ
        fsVwUtilities[`.p-fs-vw-${size}`] = {
          padding: createFsVwUtility(size)
        }
        // marginユーティリティ
        fsVwUtilities[`.m-fs-vw-${size}`] = {
          margin: createFsVwUtility(size)
        }
      })

      // Width・Padding・Margin用のfs関数ユーティリティ
      const sizingSizes = [8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96, 120, 150, 200, 250, 300, 350, 400, 450, 500, 600, 800]
      const sizingUtilities = {}

      sizingSizes.forEach(size => {
        // Width
        sizingUtilities[`.w-fs-${size}`] = {
          width: createFsUtility(size).fontSize
        }

        // Height  
        sizingUtilities[`.h-fs-${size}`] = {
          height: createFsUtility(size).fontSize
        }

        // Padding
        sizingUtilities[`.p-fs-${size}`] = {
          padding: createFsUtility(size).fontSize
        }
        sizingUtilities[`.px-fs-${size}`] = {
          paddingLeft: createFsUtility(size).fontSize,
          paddingRight: createFsUtility(size).fontSize
        }
        sizingUtilities[`.py-fs-${size}`] = {
          paddingTop: createFsUtility(size).fontSize,
          paddingBottom: createFsUtility(size).fontSize
        }
        sizingUtilities[`.pt-fs-${size}`] = {
          paddingTop: createFsUtility(size).fontSize
        }
        sizingUtilities[`.pb-fs-${size}`] = {
          paddingBottom: createFsUtility(size).fontSize
        }
        sizingUtilities[`.pl-fs-${size}`] = {
          paddingLeft: createFsUtility(size).fontSize
        }
        sizingUtilities[`.pr-fs-${size}`] = {
          paddingRight: createFsUtility(size).fontSize
        }

        // Margin
        sizingUtilities[`.m-fs-${size}`] = {
          margin: createFsUtility(size).fontSize
        }
        sizingUtilities[`.mx-fs-${size}`] = {
          marginLeft: createFsUtility(size).fontSize,
          marginRight: createFsUtility(size).fontSize
        }
        sizingUtilities[`.my-fs-${size}`] = {
          marginTop: createFsUtility(size).fontSize,
          marginBottom: createFsUtility(size).fontSize
        }
        sizingUtilities[`.mt-fs-${size}`] = {
          marginTop: createFsUtility(size).fontSize
        }
        sizingUtilities[`.mb-fs-${size}`] = {
          marginBottom: createFsUtility(size).fontSize
        }
        sizingUtilities[`.ml-fs-${size}`] = {
          marginLeft: createFsUtility(size).fontSize
        }
        sizingUtilities[`.mr-fs-${size}`] = {
          marginRight: createFsUtility(size).fontSize
        }

        // Border radius
        sizingUtilities[`.rounded-fs-${size}`] = {
          borderRadius: createFsUtility(size).fontSize
        }

        // Gap
        sizingUtilities[`.gap-fs-${size}`] = {
          gap: createFsUtility(size).fontSize
        }
        sizingUtilities[`.gap-x-fs-${size}`] = {
          columnGap: createFsUtility(size).fontSize
        }
        sizingUtilities[`.gap-y-fs-${size}`] = {
          rowGap: createFsUtility(size).fontSize
        }

        // Border width
        sizingUtilities[`.border-fs-${size}`] = {
          borderWidth: createFsUtility(size).fontSize
        }
        sizingUtilities[`.border-t-fs-${size}`] = {
          borderTopWidth: createFsUtility(size).fontSize
        }
        sizingUtilities[`.border-b-fs-${size}`] = {
          borderBottomWidth: createFsUtility(size).fontSize
        }
        sizingUtilities[`.border-l-fs-${size}`] = {
          borderLeftWidth: createFsUtility(size).fontSize
        }
        sizingUtilities[`.border-r-fs-${size}`] = {
          borderRightWidth: createFsUtility(size).fontSize
        }

        // Outline
        sizingUtilities[`.outline-fs-${size}`] = {
          outlineWidth: createFsUtility(size).fontSize
        }
        sizingUtilities[`.outline-offset-fs-${size}`] = {
          outlineOffset: createFsUtility(size).fontSize
        }

        // Shadow (box-shadow blur値)
        sizingUtilities[`.shadow-fs-${size}`] = {
          boxShadow: `0 4px ${createFsUtility(size).fontSize} rgba(0,0,0,0.1)`
        }

        // Text shadow
        sizingUtilities[`.text-shadow-fs-${size}`] = {
          textShadow: `0 2px ${createFsUtility(size).fontSize} rgba(0,0,0,0.1)`
        }

        // Transform translate
        sizingUtilities[`.translate-x-fs-${size}`] = {
          transform: `translateX(${createFsUtility(size).fontSize})`
        }
        sizingUtilities[`.translate-y-fs-${size}`] = {
          transform: `translateY(${createFsUtility(size).fontSize})`
        }
        sizingUtilities[`.-translate-x-fs-${size}`] = {
          transform: `translateX(-${createFsUtility(size).fontSize})`
        }
        sizingUtilities[`.-translate-y-fs-${size}`] = {
          transform: `translateY(-${createFsUtility(size).fontSize})`
        }

        // Top/Right/Bottom/Left positioning
        sizingUtilities[`.top-fs-${size}`] = {
          top: createFsUtility(size).fontSize
        }
        sizingUtilities[`.right-fs-${size}`] = {
          right: createFsUtility(size).fontSize
        }
        sizingUtilities[`.bottom-fs-${size}`] = {
          bottom: createFsUtility(size).fontSize
        }
        sizingUtilities[`.left-fs-${size}`] = {
          left: createFsUtility(size).fontSize
        }
        sizingUtilities[`.-top-fs-${size}`] = {
          top: `-${createFsUtility(size).fontSize}`
        }
        sizingUtilities[`.-right-fs-${size}`] = {
          right: `-${createFsUtility(size).fontSize}`
        }
        sizingUtilities[`.-bottom-fs-${size}`] = {
          bottom: `-${createFsUtility(size).fontSize}`
        }
        sizingUtilities[`.-left-fs-${size}`] = {
          left: `-${createFsUtility(size).fontSize}`
        }

        // Min/Max width/height
        sizingUtilities[`.min-w-fs-${size}`] = {
          minWidth: createFsUtility(size).fontSize
        }
        sizingUtilities[`.max-w-fs-${size}`] = {
          maxWidth: createFsUtility(size).fontSize
        }
        sizingUtilities[`.min-h-fs-${size}`] = {
          minHeight: createFsUtility(size).fontSize
        }
        sizingUtilities[`.max-h-fs-${size}`] = {
          maxHeight: createFsUtility(size).fontSize
        }

        // Space between (for flex/grid children)
        sizingUtilities[`.space-x-fs-${size}`] = {
          '& > * + *': {
            marginLeft: createFsUtility(size).fontSize
          }
        }
        sizingUtilities[`.space-y-fs-${size}`] = {
          '& > * + *': {
            marginTop: createFsUtility(size).fontSize
          }
        }

        // Scroll margin/padding
        sizingUtilities[`.scroll-m-fs-${size}`] = {
          scrollMargin: createFsUtility(size).fontSize
        }
        sizingUtilities[`.scroll-p-fs-${size}`] = {
          scrollPadding: createFsUtility(size).fontSize
        }
      })

      // fsm版も追加
      const fsmSizingSizes = [8, 12, 16, 20, 24, 28, 32, 40, 48, 64, 80, 100, 150, 200, 250, 300]

      fsmSizingSizes.forEach(size => {
        // Width (fsm)
        sizingUtilities[`.w-fsm-${size}`] = {
          '@media (max-width: 767px)': {
            width: createFsmUtility(size).fontSize
          }
        }

        // Padding (fsm)
        sizingUtilities[`.p-fsm-${size}`] = {
          '@media (max-width: 767px)': {
            padding: createFsmUtility(size).fontSize
          }
        }

        // Margin (fsm)
        sizingUtilities[`.m-fsm-${size}`] = {
          '@media (max-width: 767px)': {
            margin: createFsUtility(size).fontSize
          }
        }

        // Gap (fsm)
        sizingUtilities[`.gap-fsm-${size}`] = {
          '@media (max-width: 767px)': {
            gap: createFsmUtility(size).fontSize
          }
        }
      })

      // fsm関数のプリセット（デフォルト比率）
      const fsmSizes = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48]
      fsmSizes.forEach(size => {
        fsmUtilities[`.fsm-${size}`] = {
          '@media (max-width: 767px)': createFsmUtility(size)
        }
        // カスタム比率版（320px比率のみ変更）
        fsmUtilities[`.fsm-${size}-tight`] = {
          '@media (max-width: 767px)': createFsmUtility(size, 0.7, 1.7)
        }
        fsmUtilities[`.fsm-${size}-loose`] = {
          '@media (max-width: 767px)': createFsmUtility(size, 1.0, 1.7)
        }
      })

      // 組み合わせユーティリティ（fs + fsm）
      const responsiveText = {
        ...fsUtilities,
        ...fsmUtilities,
        ...fsVwUtilities,
        ...sizingUtilities,
        // よく使う組み合わせパターン（Figmaデザイン基準）
        '.text-heading-1': {
          ...createFsUtility(48),
          '@media (max-width: 767px)': createFsmUtility(32)
        },
        '.text-heading-2': {
          ...createFsUtility(36),
          '@media (max-width: 767px)': createFsmUtility(24)
        },
        '.text-heading-3': {
          ...createFsUtility(28),
          '@media (max-width: 767px)': createFsmUtility(20)
        },
        '.text-body': {
          ...createFsUtility(16),
          '@media (max-width: 767px)': createFsmUtility(14)
        },
        '.text-small': {
          ...createFsUtility(14),
          '@media (max-width: 767px)': createFsmUtility(12)
        },
      }

      // 3. コンポーネント（より複雑なmixin）
      const components = {
        '.card': {
          padding: theme('spacing.4'),
          borderRadius: theme('borderRadius.lg'),
          boxShadow: theme('boxShadow.md'),
          backgroundColor: theme('colors.white'),
        },
        '.container-custom': {
          width: '100%',
          maxWidth: '1440px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: theme('spacing.4'),
          paddingRight: theme('spacing.4'),
          '@media (min-width: 768px)': {
            paddingLeft: theme('spacing.8'),
            paddingRight: theme('spacing.8'),
          },
        },
      }

      addUtilities(utilities)
      addUtilities(responsiveText)
      addComponents(components)
    }),
    require('@tailwindcss/line-clamp')
  ],
}

