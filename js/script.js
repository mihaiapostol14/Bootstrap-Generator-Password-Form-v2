/* =========================================
   USER SECURE FORM
   Password Generator Module
========================================= */

;(() => {
  'use strict'

  const usf = {
    elements: {
      form: document.getElementById('usfPasswordForm'),

      length: document.getElementById('usfCountSymbol'),
      lengthValue: document.getElementById('usfCountValue'),

      uppercase: document.getElementById('usfUppercase'),
      lowercase: document.getElementById('usfLowercase'),
      numbers: document.getElementById('usfNumbers'),
      symbols: document.getElementById('usfSymbols'),

      output: document.getElementById('usfPasswordOutput'),
      outputStatus: document.getElementById('usfOutputStatus'),

      copyButton: document.getElementById('usfCopyButton'),
      exportButton: document.getElementById('usfExportButton'),

      feedback: document.getElementById('usfFeedback'),

      themeToggle: document.getElementById('usfThemeToggle'),
    },

    characters: {
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      numbers: '0123456789',
      symbols: '!@#$%^&*()_+-=[]{};:,.?',
    },

    /* ---------------------------------
           INITIALIZATION
        --------------------------------- */

    init() {
      const e = this.elements

      if (!e.form) return

      e.form.addEventListener('submit', event => {
        event.preventDefault()
        this.generate()
      })

      e.length.addEventListener('input', () => this.updateLength())

      e.copyButton.addEventListener('click', () => this.copy())

      e.exportButton.addEventListener('click', () => this.export())

      e.themeToggle.addEventListener('click', () => this.toggleTheme())

      this.initializeTheme()
      this.updateLength()
    },

    /* ---------------------------------
           LENGTH DISPLAY
        --------------------------------- */

    updateLength() {
      const length = Number(this.elements.length.value)

      this.elements.lengthValue.textContent = `${length} characters`
    },

    /* ---------------------------------
           GET SELECTED CHARACTERS
        --------------------------------- */

    getCharacterSets() {
      const e = this.elements
      const sets = []

      if (e.uppercase.checked) {
        sets.push(this.characters.uppercase)
      }

      if (e.lowercase.checked) {
        sets.push(this.characters.lowercase)
      }

      if (e.numbers.checked) {
        sets.push(this.characters.numbers)
      }

      if (e.symbols.checked) {
        sets.push(this.characters.symbols)
      }

      return sets
    },

    /* ---------------------------------
           CRYPTOGRAPHIC RANDOM INTEGER
        --------------------------------- */

    randomInt(max) {
      if (!Number.isSafeInteger(max) || max < 1) {
        throw new RangeError('Invalid random range.')
      }

      const range = 0x100000000
      const limit = range - (range % max)

      const randomValues = new Uint32Array(1)

      do {
        crypto.getRandomValues(randomValues)
      } while (randomValues[0] >= limit)

      return randomValues[0] % max
    },

    /* ---------------------------------
           SECURE CHARACTER SELECTION
        --------------------------------- */

    randomCharacter(characters) {
      return characters[this.randomInt(characters.length)]
    },

    /* ---------------------------------
           PASSWORD GENERATION
        --------------------------------- */

    generate() {
      const e = this.elements

      const length = Number(e.length.value)
      const sets = this.getCharacterSets()

      if (!Number.isInteger(length) || length < 4 || length > 50) {
        this.showFeedback('Password length must be between 4 and 50.', 'error')

        return
      }

      if (sets.length === 0) {
        this.showFeedback('Select at least one character set.', 'error')

        return
      }

      if (!globalThis.crypto?.getRandomValues) {
        this.showFeedback('Secure password generation is unavailable in this browser.', 'error')

        return
      }

      try {
        const passwordCharacters = []

        // Guarantee at least one character
        // from every selected character set.

        for (const set of sets) {
          passwordCharacters.push(this.randomCharacter(set))
        }

        const allCharacters = sets.join('')

        // Fill remaining positions.

        while (passwordCharacters.length < length) {
          passwordCharacters.push(this.randomCharacter(allCharacters))
        }

        // Secure Fisher-Yates shuffle.

        for (let i = passwordCharacters.length - 1; i > 0; i--) {
          const j = this.randomInt(i + 1)

          ;[passwordCharacters[i], passwordCharacters[j]] = [passwordCharacters[j], passwordCharacters[i]]
        }

        const password = passwordCharacters.join('')

        e.output.value = password

        e.copyButton.disabled = false
        e.exportButton.disabled = false

        e.outputStatus.textContent = 'Generated'

        this.showFeedback('Password generated successfully.', 'success')
      } catch (error) {
        console.error('Password generation failed:', error)

        this.showFeedback('Unable to generate a password. Please try again.', 'error')
      }
    },

    /* ---------------------------------
           COPY PASSWORD
        --------------------------------- */

    async copy() {
      const e = this.elements
      const password = e.output.value

      if (!password) return

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(password)
        } else {
          // Legacy fallback.

          e.output.focus()
          e.output.select()

          const successful = document.execCommand('copy')

          if (!successful) {
            throw new Error('Copy operation failed.')
          }

          e.output.setSelectionRange(0, 0)
        }

        this.showFeedback('Password copied to clipboard.', 'success')
      } catch (error) {
        console.error('Clipboard error:', error)

        this.showFeedback('Unable to copy password. Please copy it manually.', 'error')
      }
    },

    /* ---------------------------------
           EXPORT PASSWORD
        --------------------------------- */

    export() {
      const password = this.elements.output.value

      if (!password) return

      const blob = new Blob([password], { type: 'text/plain;charset=utf-8' })

      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')

      link.href = url
      link.download = 'generated-password.txt'

      document.body.appendChild(link)

      link.click()
      link.remove()

      URL.revokeObjectURL(url)

      this.showFeedback('Password export started.', 'success')
    },

    /* ---------------------------------
           FEEDBACK
        --------------------------------- */

    showFeedback(message, type = 'success') {
      const feedback = this.elements.feedback

      feedback.textContent = message

      feedback.classList.remove('is-error', 'is-success')

      feedback.classList.add(type === 'error' ? 'is-error' : 'is-success')
    },

    /* ---------------------------------
           THEME MANAGEMENT
        --------------------------------- */

    initializeTheme() {
      const savedTheme = localStorage.getItem('usf-theme')

      const theme =
        savedTheme === 'light' || savedTheme === 'dark'
          ? savedTheme
          : window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark'

      this.setTheme(theme)
    },

    setTheme(theme) {
      document.documentElement.setAttribute('data-bs-theme', theme)

      const icon = this.elements.themeToggle.querySelector('i')

      icon.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon'

      this.elements.themeToggle.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
      )

      localStorage.setItem('usf-theme', theme)
    },

    toggleTheme() {
      const currentTheme = document.documentElement.getAttribute('data-bs-theme')

      this.setTheme(currentTheme === 'dark' ? 'light' : 'dark')
    },
  }

  // Initialize module.

  usf.init()
})()
