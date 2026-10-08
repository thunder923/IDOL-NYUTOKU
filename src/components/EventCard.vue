<template>
  <v-card class="mb-4" outlined elevation="2" :style="event.archived ? 'opacity: 0.65;' : ''">
    <!-- ライブ名（イベント名） -->
    <v-card-title class="primary white--text text-h5 font-weight-bold py-3">
      <div class="d-flex align-center flex-wrap" style="gap: 8px;">
        <span>{{ event.eventName }}</span>
        <v-chip
          v-if="event.eventDate"
          small
          color="white"
          text-color="primary"
          class="font-weight-bold"
        >
          <v-icon x-small left>mdi-calendar</v-icon>
          {{ event.eventDate }}
        </v-chip>
        <v-chip
          v-if="event.archived"
          small
          color="grey darken-2"
          class="white--text font-weight-bold"
        >
          <v-icon x-small left>mdi-archive</v-icon>
          アーカイブ（終了）
        </v-chip>
      </div>
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
              <v-chip
                v-if="hasPerk(item)"
                x-small
                :color="perkStyle(item).color"
                :class="perkStyle(item).textClass"
                class="mr-2 font-weight-bold"
              >
                <v-icon x-small left>{{ perkStyle(item).icon }}</v-icon>
                {{ perkLabel(item) }}
              </v-chip>
              <span>{{ item.perk }}</span>
              <span v-if="item.perkDetail" class="ml-1 grey--text text--darken-1">（{{ item.perkDetail }}）</span>
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
import { perkTypeStyle, normalizePerkType } from '../utils/perk';

export default {
  name: 'EventCard',
  props: {
    event: {
      type: Object,
      required: true
    }
  },
  methods: {
    // 特典種別に応じたバッジスタイル（GAS側で正規化済みだが手動入力の揺れも吸収）
    perkStyle(item) {
      const text = (item.perkType ? item.perkType + ' ' : '') + (item.perk || item.perks || '');
      return perkTypeStyle(text);
    },
    // バッジのラベル（GASの正規化済み種別を優先し、手動データはその場で判定）
    perkLabel(item) {
      return item.perkType || normalizePerkType(item.perk || item.perks);
    },
    hasPerk(item) {
      const perk = item.perk || item.perks || '';
      return !!perk && perk !== 'なし';
    }
  }
};
</script>