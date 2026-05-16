export interface TownshipSeed {
  id: number;
  name: string;
}

export interface BusLineSeed {
  id: number;
  number: string;
  description: string;
}

export interface StopSeed {
  id: number;
  name: string;
  townshipId: number;
}

export interface BusLineStopSeed {
  busLineId: number;
  stopId: number;
  stopOrder: number;
}

export const townships: TownshipSeed[] = [
  { id: 1, name: 'ဗိုလ်တထောင်' },
  { id: 2, name: 'ဒဂုံဆိပ်ကမ်း' },
  { id: 3, name: 'ဒေါပုံ' },
  { id: 4, name: 'အရှေ့ဒဂုံ' },
  { id: 5, name: 'မင်္ဂလာတောင်ညွန့်' },
  { id: 6, name: 'မြောက်ဒဂုံ' },
  { id: 7, name: 'မြောက်ဥက္ကလာပ' },
  { id: 8, name: 'ပုဇွန်တောင်' },
  { id: 9, name: 'တောင်ဒဂုံ' },
  { id: 10, name: 'တောင်ဥက္ကလာပ' },
  { id: 11, name: 'တာမွေ' },
  { id: 12, name: 'သာကေတ' },
  { id: 13, name: 'သင်္ဃန်းကျွန်း' },
  { id: 14, name: 'ရန်ကင်း' },
  { id: 15, name: 'လှိုင်သာယာ' },
  { id: 16, name: 'လှည်းကူး' },
  { id: 17, name: 'မှော်ဘီ' },
  { id: 18, name: 'ထန်းတပင်' },
  { id: 19, name: 'အင်းစိန်' },
  { id: 20, name: 'မင်္ဂလာဒုံ' },
  { id: 21, name: 'ရွှေပြည်သာ' },
  { id: 22, name: 'တိုက်ကြီး' },
  { id: 23, name: 'ကိုကိုးကျွန်း' },
  { id: 24, name: 'ဒလ' },
  { id: 25, name: 'ကော့မှူး' },
  { id: 26, name: 'ခရမ်း' },
  { id: 27, name: 'ကွမ်းခြံကုန်း' },
  { id: 28, name: 'ကျောက်တန်း' },
  { id: 29, name: 'ဆိပ်ကြီးခနောင်တို' },
  { id: 30, name: 'သန်လျင်' },
  { id: 31, name: 'သုံးခွ' },
  { id: 32, name: 'တွံတေး' },
  { id: 33, name: 'အလုံ' },
  { id: 34, name: 'ဗဟန်း' },
  { id: 35, name: 'ဒဂုံ' },
  { id: 36, name: 'လှိုင်' },
  { id: 37, name: 'ကမာရွတ်' },
  { id: 38, name: 'ကျောက်တံတား' },
  { id: 39, name: 'ကြည့်မြင်တိုင်' },
  { id: 40, name: 'လမ်းမတော်' },
  { id: 41, name: 'လသာ' },
  { id: 42, name: 'ပန်းဘဲတန်း' },
  { id: 43, name: 'စမ်းချောင်း' },
  { id: 44, name: 'ဆိပ်ကမ်း' },
];

export const busLines: BusLineSeed[] = [
  {
    id: 1,
    number: '4',
    description: 'Yuzana Garden City မှ Mahar Bandula Road သို့',
  },
  { id: 2, number: '7', description: 'Taung Dagon မှ Maha Bandoola သို့' },
  { id: 3, number: '43', description: 'Hledan မှ Insein သို့' },
];

export const stops: StopSeed[] = [
  { id: 1, name: 'ပဲခူးမြစ်လမ်း', townshipId: 2 },
  { id: 2, name: 'ဧရာဝန်လမ်း', townshipId: 2 },
  { id: 3, name: 'ကျွဲမ', townshipId: 9 },
  { id: 4, name: 'ရတနာလမ်း', townshipId: 9 },
  { id: 5, name: 'သန်လျင်တံတားလမ်း', townshipId: 9 },
  { id: 6, name: 'သာကေတအဝိုင်း', townshipId: 11 },
  { id: 7, name: 'ကျောက်တိုင်', townshipId: 11 },
  { id: 8, name: 'မင်းနန္ဒာလမ်း', townshipId: 11 },
  { id: 9, name: 'မဟာဗန္ဓုလတံတား', townshipId: 38 },
  { id: 10, name: 'အနော်ရထာလမ်း', townshipId: 38 },
  { id: 11, name: 'ဆူးလေ', townshipId: 38 },
  { id: 12, name: 'မဟာဗန္ဓုလလမ်း', townshipId: 1 },
  { id: 13, name: 'ရတနာပုံလမ်း', townshipId: 6 },
  { id: 14, name: 'ကျန်စစ်သားလမ်း', townshipId: 6 },
  { id: 15, name: 'လှော်ကားလမ်း', townshipId: 19 },
  { id: 16, name: 'ပြည်ထောင်စုလမ်း', townshipId: 7 },
  { id: 17, name: 'တောင်မြောက်လမ်းဆုံ', townshipId: 5 },
  { id: 18, name: 'စမ်းဈေး', townshipId: 5 },
  { id: 19, name: 'ဇဝန', townshipId: 11 },
  { id: 20, name: 'တာမွေ (ဗာလီ)', townshipId: 11 },
  { id: 21, name: 'မင်္ဂလာဈေး', townshipId: 11 },
  { id: 22, name: 'သိမ်ဖြူ', townshipId: 1 },
  { id: 23, name: 'လှည်းတန်း', townshipId: 43 },

  { id: 25, name: 'ဗဟိုလမ်း', townshipId: 19 },
  { id: 26, name: 'အင်းစိန်ဥယျာဉ်', townshipId: 19 },
  { id: 27, name: 'YTU', townshipId: 19 },
  { id: 28, name: 'သာမိုင်းလမ်းဆုံ', townshipId: 19 },
  { id: 29, name: 'စမ်းဈေး', townshipId: 40 },
  { id: 30, name: 'ဇဝန', townshipId: 5 },
];

export const busLineStops: BusLineStopSeed[] = [
  { busLineId: 1, stopId: 1, stopOrder: 1 },
  { busLineId: 1, stopId: 2, stopOrder: 2 },
  { busLineId: 1, stopId: 3, stopOrder: 3 },
  { busLineId: 1, stopId: 4, stopOrder: 4 },
  { busLineId: 1, stopId: 5, stopOrder: 5 },
  { busLineId: 1, stopId: 6, stopOrder: 6 },
  { busLineId: 1, stopId: 7, stopOrder: 7 },
  { busLineId: 1, stopId: 8, stopOrder: 8 },
  { busLineId: 1, stopId: 9, stopOrder: 9 },
  { busLineId: 1, stopId: 10, stopOrder: 10 },
  { busLineId: 1, stopId: 11, stopOrder: 11 },
  { busLineId: 1, stopId: 12, stopOrder: 12 },
  { busLineId: 2, stopId: 13, stopOrder: 1 },
  { busLineId: 2, stopId: 14, stopOrder: 2 },
  { busLineId: 2, stopId: 15, stopOrder: 3 },
  { busLineId: 2, stopId: 16, stopOrder: 4 },
  { busLineId: 2, stopId: 17, stopOrder: 5 },
  { busLineId: 2, stopId: 18, stopOrder: 6 },
  { busLineId: 2, stopId: 19, stopOrder: 7 },
  { busLineId: 2, stopId: 20, stopOrder: 8 },
  { busLineId: 2, stopId: 21, stopOrder: 9 },
  { busLineId: 2, stopId: 10, stopOrder: 10 },
  { busLineId: 2, stopId: 11, stopOrder: 11 },
  { busLineId: 2, stopId: 12, stopOrder: 12 },
  { busLineId: 3, stopId: 23, stopOrder: 1 },
  { busLineId: 3, stopId: 24, stopOrder: 2 },
  { busLineId: 3, stopId: 25, stopOrder: 3 },
  { busLineId: 3, stopId: 26, stopOrder: 4 },
  { busLineId: 3, stopId: 27, stopOrder: 5 },
  { busLineId: 3, stopId: 28, stopOrder: 6 },
];
