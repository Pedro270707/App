/* global axios, Vue */

const TextureModal = () => import('./modal_texture.js')
const MCVersionModal = () => import('./modal_mc_version.js')
const TextureModalMultipleAdd = () => import('./modal_texture_multiple_add.js')
const ModalVersionAdd = () => import('./modal_version_add.js')
const RemoveConfirm = () => import('./remove-confirm.js')

export default {
  name: 'texture-page',
  components: {
    'texture-modal': TextureModal,
    'version-modal': MCVersionModal,
    'add-multiple-texture': TextureModalMultipleAdd,
    'add-minecraft-version': ModalVersionAdd,
    'remove-confirm': RemoveConfirm,
  },
  template: `
  <v-container>
    
    <texture-modal :dialog="dialogOpen" :disableDialog="disableDialog" :add="Object.keys(dialogData).length == 0" :data="dialogData" :types="types"></texture-modal>
    <version-modal :MCDialog="MCDialogOpen" :disableMCDialog="disableMCDialog"></version-modal>
    <add-multiple-texture :dialog="addMultiple" :disableDialog="() => { addMultiple = false }" :types="types" :editions="editions" :versions="versions"></add-multiple-texture>
    <add-minecraft-version :dialog="newVersionModal" :disableDialog="() => { newVersionModal = false }" :editions="editions" :versions="versions"></add-minecraft-version>
    <remove-confirm type="texture" :confirm="remove.confirm" :data="remove.data" :disableDialog="() => { remove.confirm = false; }" :on-submit="removeTexture"></remove-confirm>
    
    <div class="text-h4 py-4">
      {{ $root.lang().database.titles.textures }}
    </div>
    <div class="my-2 text-h5">{{ $root.lang().database.subtitles.select_texture_type }}</div>
    <div><v-btn v-for="t in texturesTypes" :key="t" :class="{ 'my-2': true, 'mr-1': true, 'v-btn--active': t === 'All' && !type && !!name }" :to="textureURL(t)" :exact="t == 'All'">{{ t }}</v-btn></div>
    <div class="my-2 text-h5">{{ $root.lang().database.subtitles.search }}</div>
    <div class="my-2">
      <v-text-field
        v-model="search"
        :append-outer-icon="search ? 'mdi-send' : undefined"
        filled
        clear-icon="mdi-close"
        clearable
        :placeholder="$root.lang().database.labels.search_texture"
        type="text"
        v-on:keyup.enter="startSearch"
        @click:append-outer="startSearch"
        @click:clear="clearSearch"
      ></v-text-field>
    </div>

    <div>
      <v-row>
        <v-col>
          <v-btn block @click="openNewMCDialog()">{{ $root.lang().database.labels.add_texture }} <v-icon right dark>mdi-plus</v-icon></v-btn>
        </v-col>
      </v-row>
      <br>
      <v-row>
        <v-col>
          <v-btn block @click="() => { newVersionModal = true }">{{ $root.lang().database.labels.add_mc_version }} <v-icon right dark>mdi-plus</v-icon></v-btn>
        </v-col>
        <v-col>
          <v-btn block @click="openModifyMCDialog()">{{ $root.lang().database.labels.edit_mc_version }}<v-icon right dark>mdi-plus</v-icon></v-btn>
        </v-col>
      </v-row>

      <div class="my-2 text-h5">{{ $root.lang().database.subtitles.texture_result }}</div>
      <v-list v-if="Object.keys(textures).length" two-line color="rgba(255, 255, 255, 0.08)" >
        <v-row><v-col :cols="12/listColumns" xs="1"
            v-for="(textures_arr, index) in splittedResults"
            :key="index"
          >
          <v-list-item
            v-for="texture in textures_arr"
            :key="texture.id"
          >
            <v-list-item-content style="display: contents">
              <v-list-item-avatar tile :style="{ 
                  'height': '64px !important', 
                  'min-width': '64px !important', 
                  'background': 'rgba(39, 39, 39, 0.8)', 
                  'max-width': 'fit-content', 
                  'padding': '0 10px 0 10px', 
                  'border-radius': '4px !important', 
                  'flex': 'auto' 
                }" 
              >#{{ texture.id }}</v-list-item-avatar>
              <v-list-item-title>
                {{ texture.name }}
                <v-list-item-subtitle v-text="(texture.type||[]).join(', ')"></v-list-item-subtitle>
              </v-list-item-title>
            </v-list-item-content>

            <v-list-item-action>
              <v-btn icon @click="openDialog(texture)">
                <v-icon color="white lighten-1">mdi-pencil</v-icon>
              </v-btn>
            </v-list-item-action>
            <v-list-item-action>
              <v-btn icon @click="askRemove(texture)">
                <v-icon color="red lighten-1">mdi-delete</v-icon>
              </v-btn>
            </v-list-item-action>
          </v-list-item>
        </v-col></v-row>

        <v-btn 
          :style="{ 'margin': 'auto', 'min-width': '250px !important' }"
          :disabled="displayedResults >= Object.keys(textures).length"
          block
          @click="showMore()" 
          :v-if="displayedResults < Object.keys(textures).length"
          elevation="2"
        >{{ $root.lang().global.btn.load_more }}</v-btn>

      </v-list>
      <div v-else><br><p><i>{{ $root.lang().global.no_results }}</i></p></div>
    </div>
  </v-container>`,
  data () {
    const INCREMENT = 250

    return {
      newVersionModal: false,
      addMultiple: false,
      recompute: false,
      types: [],
      editions: [],
      versions: [],
      textures: {},
      search: '',
      dialogOpen: false,
      MCDialogOpen: false,
      dialogData: {},
      remove: {
        confirm: false,
        data: {}
      },
      displayedResults: INCREMENT
    }
  },
  computed: {
    texturesTypes: function () {
      return ['all', ...this.types]
    },
    type: function () {
      if (this.$route.params.type && this.texturesTypes.includes(this.$route.params.type)) return this.$route.params.type
      return undefined
    },
    name: function () {
      if (this.type !== undefined) return this.$route.params.name
      return this.$route.params.type
    },
    listColumns: function () {
      let columns = 1

      if (this.$vuetify.breakpoint.mdAndUp && this.displayedResults >= 6) {
        columns = 2
        if (this.$vuetify.breakpoint.lgAndUp && this.displayedResults >= 21) {
          columns = 3
        }
      }

      if (Object.keys(this.textures).length === 1) columns = 1

      return columns
    },
    splittedResults: function () {
      const res = []

      const keys = Object.keys(this.textures)
      const len = keys.length

      for (let col = 0; col < this.listColumns; ++col) {
        res.push([])
      }

      let arrayIndex = 0

      for (let i = 0; i < Math.min(this.displayedResults, len); i++) {
        res[arrayIndex].push(this.textures[keys[i]])
        arrayIndex = (arrayIndex + 1) % this.listColumns
      }

      return res
    }
  },
  methods: {
    textureURL (t) {
      return this.name ? `/textures/${t}/${this.name}` : `/textures/${t}`
    },
    startSearch: function () {
      let newPath

      if (this.name) {
        const splitted = this.$route.path.split('/')
        splitted.pop()
        newPath = splitted.join('/')
      } else newPath = this.$route.path

      if (!newPath.endsWith('/')) newPath += '/'

      newPath += this.search

      if (newPath === this.$route.path) console.warn(newPath)
      else this.$router.push(newPath)
    },
    clearSearch: function () {
      this.search = ''
      this.startSearch()
    },
    openDialog: function (data = {}) {
      this.dialogOpen = true
      this.dialogData = data
    },
    disableDialog: function (refresh = false) {
      this.dialogOpen = false

      if (refresh) {
        this.getTypes()
        this.getEditions()
        this.getTextures()
        this.getVersions()
      }
    },
    openModifyMCDialog: function () {
      this.MCDialogOpen = true
    },
    disableMCDialog: function () {
      this.MCDialogOpen = false
    },
    openNewMCDialog: function () {
      this.addMultiple = true
    },
    askRemove: function (data) {
      this.remove.data = data
      this.remove.confirm = true
    },
    getTypes: function () {
      axios.get('/textures/types')
        .then((res) => {
          this.types = res.data
        })
        .catch(function (err) {
          console.error(err)
        })
        .finally(() => {
          Vue.nextTick(() => {
            this.search = this.name
          })
        })
    },
    getEditions: function () {
      axios.get('/textures/editions')
        .then((res) => {
          this.editions = res.data
        })
        .catch(function (err) {
          console.error(err)
        })
    },
    getVersions: function () {
      axios.get('/textures/versions')
        .then((res) => {
          this.versions = res.data
        })
        .catch(function (err) {
          console.error(err)
        })
    },
    getTextures: function () {
      axios.get(this.$route.path)
        .then((res) => {
          this.textures = res.data
        })
        .catch(function (err) {
          console.error(err)
        })
    },
    update: function () {
      this.getTypes()
      this.getTextures()
      this.getEditions()
      this.getVersions()
    },
    showMore: function () {
      this.displayedResults += 100
      this.update()
    },
    removeTexture: function(data) {
      const body = {
        id: data.id,
        token: this.$root.user.access_token
      }

      return axios.post('/textures/remove', body)
    }
  },
  watch: {
    $route () {
      this.getTextures()
    }
  },
  mounted: function () {
    this.update()
  }
}
