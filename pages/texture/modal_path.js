/* global axios, Vue */

export default {
  name: 'path-modal',
  template: `
  <v-dialog
    v-model="subPathDialog"
    persistent
    max-width="600"
  >
    <v-card>
      <v-card-title class="headline" v-text="subPathDialogTitle"></v-card-title>
      <v-card-text>
        <v-row>
          <v-col class="col-12" :sm="12">
            <v-form ref="form">
              <v-text-field v-if="add == false" hint="⚠️ Changing the Path ID can break everything" v-model="subPathFormData.id" label="Path ID"></v-text-field>
              <v-text-field v-if="add == false" hint="⚠️ Changing the Use ID can break everything" v-model="subPathFormData.useID" label="Use ID"></v-text-field>
              <v-text-field hint="The path should start from the root directory (ex: assets/...)" v-model="subPathFormData.path" label="Path"></v-text-field>
              <v-select required multiple v-model="subPathFormData.versions" :items="versions" label="MC Versions"></v-select>
            </v-form>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="red darken-1"
          text
          @click="disableSubPathDialog"
        >
          Cancel
        </v-btn>
        <v-btn
          color="darken-1"
          text
          @click="send"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>`,
  props: {
    subPathDialog: {
      type: Boolean,
      required: true
    },
    disableSubPathDialog: {
      type: Function,
      required: true
    },
    add: {
      type: Boolean,
      required: false,
      default: false
    },
    pathData: {
      type: Object,
      required: true
    },
    versions: {
      type: Array,
      required: false,
      default: function () {
        return ['dungeons-master', '1.17.1', '1.17.0', '1.16.5', '1.16.220', '1.16.210', '1.15.2', '1.14.4', '1.13.2', '1.12.2', '1.11.2', '1.10.2', '1.9.4', '1.8.9', '1.7.10', '1.6.4', '1.5.2' ]
      }
    },
    useID: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      // those var names does not make any sens anymore lmao
      subPathFormData: {
        id: '',
        useID: '',
        path: '',
        versions: []
      }
    }
  },
  computed: {
    subPathDialogTitle: function() {
      return `${this.add ? `Add a new` : `Edit`} path`
    }
  },
  methods: {
    send: function() {
      let newData = JSON.parse(JSON.stringify(this.subPathFormData))
      if (this.add) newData.useID = this.useID

      axios.post(`/paths/${this.add ? `add` : `change`}`, newData)
      .then(() => {
        this.$root.showSnackBar('Ended successfully', 'success')
        this.disableSubPathDialog(true)
      })
      .catch(err => {
        console.error(err)
        this.$root.showSnackBar(`${err.message}: ${err.response.data.error}`, 'error')
      })
    }
  },
  watch: {
    subPathDialog: function () {
      Vue.nextTick(() => {

        if (!this.add) {
          this.subPathFormData.versions = this.pathData.versions
          this.subPathFormData.id = this.pathData.id
          this.subPathFormData.path = this.pathData.path
          this.subPathFormData.useID = this.pathData.useID
        }
        else this.$refs.form.reset()
        
      })
    }
  }
}