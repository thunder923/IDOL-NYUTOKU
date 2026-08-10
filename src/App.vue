<template>
  <v-app>
    <v-main>
      <v-container>
        <!-- ヘッダーエリア -->
        <div class="d-flex justify-space-between align-center mb-6">
          <h1 class="text-h4 font-weight-bold">イベント一覧</h1>
          
          <v-btn
            color="success"
            large
            outlined
            href="https://docs.google.com/forms/d/e/1FAIpQLScrP0oF42vhkNU1YUSLih_HJa30vbpd0FfXq5L19oX-DIK3Zg/viewform?usp=dialog"
            target="_blank"
            rel="noopener noreferrer"
            class="font-weight-bold"
          >
            <v-icon left>mdi-file-document-edit-outline</v-icon>
            情報提供はこちら
          </v-btn>
        </div>
        
        <!-- ローディング表示 -->
        <div v-if="loading" class="text-center my-8">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="mt-4 grey--text text--darken-1">データを読み込んでいます...</p>
        </div>

        <!-- カード一覧表示 -->
        <v-row v-else>
          <v-col
            v-for="event in events"
            :key="event.eventName"
            cols="12"
            md="6"
          >
            <EventCard :event="event" />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import EventCard from './components/EventCard.vue';

export default {
  name: 'App',
  components: {
    EventCard
  },
  data() {
    return {
      loading: true,
      events: []
    };
  },
  mounted() {
    this.fetchEvents();
  },
  methods: {
    async fetchEvents() {
      const GAS_URL = 'https://script.google.com/macros/s/AKfycbyarH7Ur__WCEiQmqZROgCp1_I2G2hnRkXbRn7ckXQMr5DNutkQN1g7CLBh4Jj2q4iZ/exec';
      
      try {
        const response = await fetch(GAS_URL);
        const rawData = await response.json();

        const grouped = {};
        rawData.forEach(item => {
          if (!item.eventName) return;
          
          if (!grouped[item.eventName]) {
            grouped[item.eventName] = {
              eventName: item.eventName,
              groups: []
            };
          }

          const toArr = (v) => typeof v === 'string' ? v.split(',').map(s => s.trim()) : (Array.isArray(v) ? v : []);

          const perfList = toArr(item.performers).filter(Boolean);
          const stageList = toArr(item.stages).filter(Boolean);
          const perkList = toArr(item.perks).filter(Boolean);
          const timeList = toArr(item.time || item.times || item.timeSlot).filter(Boolean);

          const maxLen = Math.max(perfList.length, stageList.length, perkList.length, timeList.length);

          for (let i = 0; i < maxLen; i++) {
            const p = perfList[i] || perfList[0] || '';
            const s = stageList[i] || stageList[0] || '';
            const k = perkList[i] || perkList[0] || '';
            const t = timeList[i] || timeList[0] || '';

            if (p || s || k || t) {
              grouped[item.eventName].groups.push({
                performer: p,
                stage: s,
                perk: k,
                time: t
              });
            }
          }
        });

        this.events = Object.values(grouped);

      } catch (error) {
        console.error('データの取得に失敗しました:', error);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>