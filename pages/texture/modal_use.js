/* global axios, Vue */

const pathModal = () => import('./modal_path.js')
const removeConfirm = () => import('./remove-confirm.js')

export default {
  name: 'use-modal',
  components: {
    pathModal,
    removeConfirm
  },
  template: `
  <v-dialog
    v-model="subDialog"
    max-width="600"
  >
    <path-modal :subPathDialog="subPathDialogOpen" :disableSubPathDialog="disableSubPathDialog" :add="Object.keys(subPathDialogData).length == 0" :useID="subFormData.id" :pathData="subPathDialogData"></path-modal>
    <remove-confirm type="path" :confirm="remove.confirm" :disableDialog="closeAndUpdate" :data="remove.data"></remove-confirm>
    
    <v-card>
      <v-card-title class="headline" v-text="subDialogTitle"></v-card-title>
      <v-card-text>
        <v-row>
          <v-col class="col-12" :sm="12">
            <v-form ref="form">
              <v-text-field v-model="subFormData.textureUseName" :label="$root.lang().database.labels.use_name"></v-text-field>
              <v-text-field v-if="add == false" :hint="'⚠️ ' + $root.lang().database.hints.use_id" required v-model="subFormData.id" :label="$root.lang().database.labels.use_id"></v-text-field>
              <v-text-field v-if="add == false" :hint="'⚠️ ' + $root.lang().database.hints.texture_id" required clearable v-model="subFormData.textureID" :label="$root.lang().database.labels.texture_id"></v-text-field>
              <v-select required v-model="subFormData.editions[0]" :items="editions" :label="$root.lang().database.labels.use_edition"></v-select>
              <h2 class="title">{{ $root.lang().database.subtitles.paths }}</h2>
              <p v-if="add" align="center" style="color: red">⚠️<br><strong>{{ $root.lang().database.hints.warning_path }}</strong></p>
              <v-list v-if="Object.keys(subFormData.paths).length && add == false" label="Texture Paths">
                <v-row>
                  <v-list-item
                    v-for="(path, index) in subFormData.paths"
                    :key="index"
                  >

                  <v-list-item-content :style="{ 'display': 'contents' }">
                    <v-list-item-title>
                      <v-list-item :style="{ 'display': 'contents', 'text-align': 'right' }">{{ path.path }}</v-list-item>
                      <v-list-item-subtitle v-text="(path.versions||[]).join(', ')"></v-list-item-subtitle>
                    </v-list-item-title>
                  </v-list-item-content>

                  <v-list-item-action>
                    <v-btn icon @click="openSubPathDialog(path)">
                      <v-icon color="white lighten-1">mdi-pencil</v-icon>
                    </v-btn>
                  </v-list-item-action>
                  <v-list-item-action>
                    <v-btn icon @click="askRemovePath(path)">
                      <v-icon color="red lighten-1">mdi-delete</v-icon>
                    </v-btn>
                  </v-list-item-action>

                  </v-list-item>
                </v-row>
              </v-list>
              <div v-else><template v-if="add == false">{{ $root.lang().database.labels.no_path_found }}</template></div>

              <v-btn block :disabled="add" :style="{ 'margin-top': '10px' }" color="secondary" @click="openSubPathDialog()">{{ $root.lang().database.labels.add_new_path }} <v-icon right dark>mdi-plus</v-icon></v-btn>

            </v-form>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="red darken-1"
          text
          @click="disableSubDialog"
        >
          {{ $root.lang().global.btn.cancel }}
        </v-btn>
        <v-btn
          color="darken-1"
          text
          @click="send"
        >
          {{ $root.lang().global.btn.save }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>`,
  props: {
    subDialog: {
      type: Boolean,
      required: true
    },
    disableSubDialog: {
      type: Function,
      required: true
    },
    add: {
      type: Boolean,
      required: false,
      default: false
    },
    data: {
      type: Object,
      required: true
    },
    editions: {
      type: Array,
      required: false,
      default: function () { return ['java', 'bedrock', 'dungeons'] }
    },
    textureID: {
      type: String,
      required: true
    },
    usesLength: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      subFormData: {
        editions: [],
        id: '',
        textureID: '',
        textureUseName: '',
        paths: {}
      },
      subPathDialogOpen: false,
      subPathDialogData: {},
      remove: {
        confirm: false,
        data: {}
      },
      suffix: settings.uses.suffix
    }
  },
  computed: {
    subDialogTitle: function () {
      return this.add ? this.$root.lang().database.titles.add_use : this.$root.lang().database.titles.change_use
    },
  },
  methods: {
    openSubPathDialog: function (data = {}) {
      this.subPathDialogOpen = true
      this.subPathDialogData = data
    },
    disableSubPathDialog: function () {
      this.subPathDialogOpen = false
      this.getPaths(this.subFormData.id)
      this.$forceUpdate()
    },
    closeAndUpdate: function () {
      this.remove.confirm = false
      this.getPaths(this.subFormData.id)
      this.$forceUpdate()
    },
    MinecraftSorter: function (a, b) {
      const aSplit = a.split('.').map(s => parseInt(s))
      const bSplit = b.split('.').map(s => parseInt(s))

      if (aSplit.includes(NaN) || bSplit.includes(NaN)) {
        return String(a).localeCompare(String(b)) // compare as strings
      }

      const upper = Math.min(aSplit.length, bSplit.length)
      let i = 0
      let result = 0
      while (i < upper && result == 0) {
        result = (aSplit[i] == bSplit[i]) ? 0 : (aSplit[i] < bSplit[i] ? -1 : 1) // each number
        ++i
      }

      if (result != 0) return result

      result = (aSplit.length == bSplit.length) ? 0 : (aSplit.length < bSplit.length ? -1 : 1) // longer length wins

      return result
    },
    send: function () {
      const newData = JSON.parse(JSON.stringify(this.subFormData))
      newData.token = this.$root.user.access_token

      if (this.add) {
        newData.id = this.textureID + this.suffix[this.usesLength]
        newData.textureID = parseInt(this.textureID, 10)
      }

      axios.post(`/uses/${this.add ? 'add' : 'change'}`, newData)
        .then(() => {
          this.$root.showSnackBar(this.$root.lang().global.ends_success, 'success')
          this.disableSubDialog(true)
        })
        .catch(err => {
          console.error(err)
          this.$root.showSnackBar(`${err.message}: ${err.response.data.error}`, 'error')
        })
    },
    getPaths: function (useID) {
      axios.get('/paths/search', {
        params: {
          useID: useID
        }
      })
        .then((res) => {
          const temp = res.data
          this.subFormData.paths = {}

          for (let i = 0; i < temp.length; i++) {
            temp[i].versions.sort(this.MinecraftSorter)
            this.subFormData.paths[temp[i].id] = temp[i]
          }
        })
        .catch(function (err) {
          console.error(err)
        })
    },
    askRemovePath: function (data) {
      this.remove.data = data
      this.remove.confirm = true
    }
  },
  watch: {
    subDialog: function () {
      Vue.nextTick(() => {
        if (!this.add) {
          this.subFormData.editions = this.data.editions
          this.subFormData.id = this.data.id
          this.subFormData.textureUseName = this.data.textureUseName
          this.subFormData.textureID = this.data.textureID
          this.getPaths(this.data.id)
        } else {
          this.$refs.form.reset()
          this.subFormData.paths = {}
        }
      })
    }
  }
}
