import { html, css, LitElement } from 'lit-element'
import { parseFile } from './index'

export class CsvValidateElement extends LitElement {
  static get properties () {
    return {
      _summary: {
        type: String
      },
      _results: {
        type: Array
      },
      _progress: {
        type: Number
      },
      files: {
        type: Array
      }
    }
  }

  static get styles () {
    return css` 
    :host {
      font-family: Verdana, Geneva, Tahoma, sans-serif;
    }
    
    h1, h2 {
      text-align: center;
      font-family: Arial, Helvetica, sans-serif;
    }
    
    #drop-area {
      border: 2px dashed #ccc;
      border-radius: 20px;
      width: 480px;
      margin: 20px auto;
      padding: 50px 20px;
    }
    #drop-area.highlight {
      border-color: purple;
    }
    
    .csv-input-form {
      margin-bottom: 10px;
    }
    p.csv-input-form {
      margin-top: 0;
    }
    .button {
      /* display: inline-block; */
      display: block;
      padding: 10px;
      background: #ddd;
      cursor: pointer;
      border-radius: 5px;
      border: 1px solid #ddd;
      /* float: right; */
      text-align: center;
    }
    .button:hover {
      background: #ccc;
    }
    #fileElem {
      display: none;
    }
    
    #results {
      margin: 2.5em auto;
      /* min-width: 480px; */
      /* border: 2px solid #ccc; */
      max-width: 1024px;
    }
    progress {
      height: 1.5em;
      width: 100%;
    }
    
    dt {
      font-weight: bolder;
      padding-top: 0.7em;
      padding-bottom: 0.3em;
    }
    
    .ok {
      color: green;
    }
    .fail {
      color: darkred;
    }
    .indicator {
      padding-left: 2em;
    }
    
    #summary {
      font-weight: bolder;
      padding-top: 1em;
    }`
  }

  constructor () {
    super()
    this._results = []
  }

  render () {
    return html`
      <h1>CSV Validation</h1>
      <div id="drop-area" @drop="${this._handleDrop}">
          <form class="csv-input-form">
              <p>Upload CSV files for the validation with the file dialog or by dragging and dropping them onto the dashed
                  region</p>
              <input type="file" id="fileElem" multiple accept=".csv, text/csv, application/csv" @change="${e => this._handleFiles(e.target.files)}">
              <label class="button" for="fileElem">Select CSV files</label>
          </form>
      </div>
      <div>
          <h2>Validation Results</h2>
          <progress id="progress-all" max=100 value="${this._progress}"></progress>
          <dl id="report">
              ${this._results.map(({ fileName, success, messages }) => html`
                <dt>
                    ${fileName}
                    <span class="${success ? 'ok' : 'fail'} indicator">${success ? 'OK' : 'FAIL'}</span>
                    ${messages.map(message => html`
                        <dd>${message}</dd>`
                    )}
                </dt>
              `)}
          </dl>
          <p id="summary" class="${this._hasFailures ? 'fail' : 'ok'}">
            ${this._summaryMessage} 
          </p>
      </div>
    `
  }

  get _hasFailures () {
    return this._results.some(({ success }) => !success)
  }

  get _summaryMessage () {
    const fails = this._results.filter(({ success }) => !success).length

    return this._hasFailures ? `FAILED files: ${fails}/${this._results.length}` : `Succeed all files: ${this._results.length}`
  }

  firstUpdated (_changedProperties) {
    this.initDropArea()
  }

  initDropArea () {
    const dropArea = this.shadowRoot.querySelector('#drop-area')

    // Prevent default behaviors
    ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, preventDefaults, false)
    })

    function preventDefaults (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    // Highligh the dropping area
    ;['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, highlight, false)
    })

    ;['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, unhighlight, false)
    })

    function highlight (e) {
      dropArea.classList.add('highlight')
    }

    function unhighlight (e) {
      dropArea.classList.remove('highlight')
    }
  }

  async _handleFiles (files) {
    // files.length can be used to show the processing progress
    // ([...files]).forEach(parseFile); // files is not an array, but a FileList

    // Cleanup results representation
    this._progress = 0
    if (!files.length) { return }

    // Evaluate total size of all files
    let totalSize = 0 // Total size of files
    for (const file of files) { totalSize += file.size }
    let processedSize = 0 // Size of the processed files
    // Visualize report
    const results = []
    for (const file of files) {
      const msgs = [] // Array of strings
      // const parsed = await parseFile(file, msgs, size => {
      //   progressBar.value = Math.round((processedSize + size) / totalSize * 100)
      // })
      let parsed = false
      try {
        await parseFile(file, msgs, size => {
          this._progress = Math.round((processedSize + size) / totalSize * 100)
        }).then(() => { parsed = true })
        //     .catch((err) => {
        //       parsed = false
        //       msgs.push(err)
        //     })
      } catch (err) {
        msgs.push(err)
        console.error(err)
      }
      console.log(`handleFiles()> parsed (${parsed}): ${file.name}, msgs: ${msgs.length}`)
      processedSize += file.size

      results.push({
        fileName: file.name,
        success: parsed,
        messages: msgs
      })
    }

    this._results = results
    this._progress = 100
  }

  _handleDrop (e) {
    const dt = e.dataTransfer
    // let files = dt.files
    // handleFiles(files)

    // Note: there are different interfaces exist for files processing: DataTransferItemList vs
    let files = dt.files // Use DataTransfer interface to access the file(s)
    if (files === undefined && dt.items) {
      // If dropped items aren't files, reject them
      files = [...dt.items].filter(e => e.kind === 'file').map(e => e.getAsFile())
    }
    this._handleFiles(dt.files)
  }
}
