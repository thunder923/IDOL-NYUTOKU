<template>
  <v-card class="mb-4" outlined elevation="2">
    <!-- イベント名 -->
    <v-card-title class="primary white--text text-h5 font-weight-bold py-3">
      {{ event.eventName }}
    </v-card-title>

    <v-card-text class="pa-3">
      <!-- 出演グループ別アコーディオン -->
      <v-expansion-panels multiple flat>
        <v-expansion-panel
          v-for="(item, index) in event.groups"
          :key="index"
          class="mb-2 border rounded"
        >
          <!-- グループ名 ＆ 出演時間 -->
          <v-expansion-panel-header class="font-weight-bold text-subtitle-1 primary--text pa-3">
            <div class="d-flex align-center flex-wrap">
              <span class="mr-2">
                <v-icon color="primary" class="mr-1">mdi-account</v-icon>
                {{ item.performers }}
              </span>
              <v-chip
                v-if="item.time"
                small
                color="orange lighten-4"
                class="orange--text text--dark-3 font-weight-bold ml-auto mr-2"
              >
                <v-icon left small color="orange darken-2">mdi-clock-outline</v-icon>
                {{ item.time }}
              </v-chip>
            </div>
          </v-expansion-panel-header>

          <!-- アコーディオンの中身 -->
          <v-expansion-panel-content class="pt-2">
            <!-- 時間 -->
            <div v-if="item.time" class="mb-2 body-1">
              <span class="font-weight-bold orange--text text--dark-2">
                <v-icon small color="orange darken-2" class="mr-1">mdi-clock-outline</v-icon>出演時間：
              </span>
              <span>{{ item.time }}</span>
            </div>

            <!-- ステージ -->
            <div class="mb-2 body-1">
              <span class="font-weight-bold secondary--text">
                <v-icon small color="secondary" class="mr-1">mdi-stadium</v-icon>ステージ：
              </span>
              <span>{{ item.stages }}</span>
            </div>

            <!-- 特典 -->
            <div class="mb-3 body-1">
              <span class="font-weight-bold success--text">
                <v-icon small color="success" class="mr-1">mdi-gift</v-icon>入場特典：
              </span>
              <span>{{ item.perks }}</span>
            </div>

            <!-- 公式URL -->
            <div v-if="item.url" class="mt-2">
              <v-btn
                :href="item.url"
                target="_blank"
                rel="noopener noreferrer"
                color="blue darken-1"
                outlined
                small
                rounded
              >
                <v-icon left small>mdi-open-in-new</v-icon>
                公式X / 告知を開く
              </v-btn>
            </div>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'EventCard',
  props: {
    event: {
      type: Object,
      required: true
    }
  }
};
</script>
