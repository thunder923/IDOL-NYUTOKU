<template>
  <v-card class="mb-4" outlined elevation="2">
    <!-- ライブ名（イベント名） -->
    <v-card-title class="primary white--text text-h5 font-weight-bold py-3">
      {{ event.eventName }}
    </v-card-title>

    <v-card-text class="pa-3">
      <!-- アコーディオン（グループごと） -->
      <v-expansion-panels multiple flat>
        <v-expansion-panel
          v-for="(item, index) in event.groups"
          :key="index"
          class="mb-2 border rounded"
        >
          <!-- グループ名 ＆ 出演時間 -->
          <v-expansion-panel-header class="font-weight-bold text-subtitle-1 primary--text pa-3">
            <div class="d-flex justify-space-between align-center w-100 pr-2">
              <span>
                <v-icon color="primary" class="mr-2">mdi-account</v-icon>
                {{ item.performer }}
              </span>
              <v-chip
                v-if="item.time"
                small
                color="amber lighten-4"
                class="orange--text text--dark-4 font-weight-bold"
              >
                <v-icon x-small left color="orange darken-3">mdi-clock-outline</v-icon>
                {{ item.time }}
              </v-chip>
            </div>
          </v-expansion-panel-header>

          <!-- 開いた中身 -->
          <v-expansion-panel-content class="pt-2">
            <div v-if="item.time" class="mb-2 body-1">
              <span class="font-weight-bold orange--text text--dark-2">
                <v-icon small color="orange darken-2" class="mr-1">mdi-clock-outline</v-icon>出演時間：
              </span>
              <span>{{ item.time }}</span>
            </div>

            <div class="mb-2 body-1">
              <span class="font-weight-bold secondary--text">
                <v-icon small color="secondary" class="mr-1">mdi-stadium</v-icon>ステージ：
              </span>
              <span>{{ item.stage }}</span>
            </div>

            <div class="mb-3 body-1">
              <span class="font-weight-bold success--text">
                <v-icon small color="success" class="mr-1">mdi-gift</v-icon>入場特典：
              </span>
              <span>{{ item.perk }}</span>
            </div>

            <!-- 公式X / 告知リンクボタン（URLがある場合のみ表示） -->
            <div v-if="item.xUrl" class="mt-3">
              <v-btn
                outlined
                rounded
                color="primary"
                small
                :href="item.xUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                <v-icon small class="mr-1">mdi-open-in-new</v-icon>
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