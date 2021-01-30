<template>
  <div>
    <!-- <h1>CSV Validation v<span id="app-version"></span></h1> -->
    <noscript>Your browser either does not support or blocks JavaScript, which is mandatory to interact with this
      page!</noscript>
    <div id="drop-area">
      <form class="csv-input-form">
        <p>Upload CSV files for the validation with the file dialog or by dragging and dropping them onto the dashed
          region</p>
        <input type="file" id="fileElem" multiple accept=".csv, text/csv, application/csv">  <!-- onchange="handleFiles(this.files)";  Note: functions are not accessible in the uniform way from HTML with the webpack bundle vs direct script linkage (except for the explicit module variable import rather than a file linkage) -->
        <label class="button" for="fileElem">Select CSV files</label>
      </form>
    </div>
    <div id="results">
      <h2>Validation Results v<span id="app-version"></span></h2>
      <progress id="progress-all" max=100 value=0></progress>
      <!-- <dl id="report">
        <dt>test.csv <span class="indicator ok">OK</span></dt>
        <dd>WARNING: a non-standard item delimiter is inferred: 1</dd>
        <dt>test2.csv <span class="indicator fail">FAIL</span></dt>
        <dd>ERROR: cannot infer the record separator</dd>
        <dt>test3.csv  ...</dt>
      </dl>
      <p id="summary" class="fail">FAILED files: 1/3</p>
      <p id="summary" class="ok">Succeed all files: 3</p>
      <p>Succeed: 1/2 files</p> -->
    </div>
  </div>
</template>

<script>
export default {
  mounted () {
    import('../main').then(module => {
      this.dynamicComponent = module.default
    })
    // if (!window.Stripe) {
    //   const stripeScript = document.createElement('script')
    //   stripeScript.setAttribute('src', 'https://js.stripe.com/v3')
    //   stripeScript.onload = () => {
    //     this.stripe = window.Stripe('pk_live_ASX9Wwep9HMDO883ZVtFpNMw00haqSFDt9')
    //   }
    //   document.head.appendChild(stripeScript)
    // }
  },
  // data() {
  //   return {
  //     message: 'TestComp'
  //   }
  // },
  // methods: {
  //   click() {
  //     alert('hi')
  //   }
  // },
  // props: ['title']
}
</script>

<style>
 /* .box {
   padding: 20px;
   margin: 2px;
   box-shadow: 0 0 10px black;
 } */

noscript {
  color: #c30000;
  font-weight: bolder;
  font-size: larger;
}

#drop-area {
  border: 2px dashed #ffb15e;
  border-radius: 20px;
  width: 480px;
  margin: 20px auto;
  padding: 50px 20px;
}
#drop-area.highlight {
  border-color: #ff441c;
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
  /* background: #ff441c; */
}

dt {
  font-weight: bold;
  padding-top: 0.7em;
  padding-bottom: 0.3em;
}

.ok {
  color: green;
}
.fail {
  color: #c30000;
}
.indicator {
  padding-left: 2em;
}

#summary {
  font-weight: bold;
  padding-top: 1em;
}
</style>