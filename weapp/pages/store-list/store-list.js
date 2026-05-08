// pages/store-list/store-list.js
const app = getApp();

// 与 Expo 版本保持一致的门店坐标
const STORES = [
  {
    id: 'kuchai',
    name: 'Tea Stories (Kuchai)',
    address: 'Jalan Kuchai Maju 9, Kuchai Entrepreneurs Park',
    lat: 3.088849,
    lng: 101.686589
  },
  {
    id: 'sri-petaling',
    name: 'Tea Stories (Sri Petaling)',
    address: 'Jalan Radin Bagus, Bandar Baru Sri Petaling',
    lat: 3.201633,
    lng: 101.624323
  },
  {
    id: 'cheras',
    name: 'Tea Stories (Cheras)',
    address: 'Jalan Dataran Cheras 3, Dataran Perniagaan Cheras',
    lat: 3.03592,
    lng: 101.765402
  }
];

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km) {
  if (km == null || Number.isNaN(km)) return '';
  if (km < 0.1) return '<0.1 km';
  return `${km.toFixed(1)} km`;
}

function normalizeLatLng(lat, lng) {
  const a = Number(lat);
  const o = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(o)) return { lat: null, lng: null, swapped: false };

  // 若经纬度被交换（纬度不可能 > 90）则自动纠正
  if (Math.abs(a) > 90 && Math.abs(o) <= 90) return { lat: o, lng: a, swapped: true };
  return { lat: a, lng: o, swapped: false };
}

Page({
  data: {
    stores: [],
    selectedStoreId: null
  },
  onLoad() {
    const currentId = app.getPickupStoreId ? app.getPickupStoreId() : null;
    this.initStores(currentId);
  },
  initStores(currentId) {
    const baseStores = STORES.map((s) => ({ ...s }));
    const applyStores = (list) => {
      const selectedStoreId = currentId || (app.getPickupStoreId && app.getPickupStoreId()) || list[0].id;
      if (app.setPickupStoreId) app.setPickupStoreId(selectedStoreId);
      this.setData({ stores: list, selectedStoreId });
    };

    // 先渲染占位距离，避免“看起来没计算”
    applyStores(baseStores.map((s) => ({ ...s, distanceText: '...' })));

    const updateWithLocation = (lat, lng) => {
      if (lat == null || lng == null) {
        const list = baseStores.map((s) => ({ ...s, distanceText: '-- km' }));
        applyStores(list);
        return;
      }
      const withDistance = baseStores
        .map((s) => {
          const d = haversine(lat, lng, s.lat, s.lng);
          return { ...s, distanceKm: d, distanceText: formatDistance(d) };
        })
        .sort((a, b) => (a.distanceKm || 9999) - (b.distanceKm || 9999));
      applyStores(withDistance);

      // 若全部距离都异常偏大，提示检查模拟器位置/授权
      const min = withDistance.reduce((m, s) => (s.distanceKm != null && s.distanceKm < m ? s.distanceKm : m), 1e9);
      if (min > 300) {
        wx.showToast({ title: '定位位置异常，请检查模拟位置', icon: 'none' });
      }
    };

    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      highAccuracyExpireTime: 3000,
      success: (res) => {
        const n = normalizeLatLng(res.latitude, res.longitude);
        updateWithLocation(n.lat, n.lng);
      },
      fail: () => {
        updateWithLocation(null, null);
        wx.showModal({
          title: '需要定位权限',
          content: '开启定位后可显示您与各自取门店的距离。是否前往设置开启定位？',
          confirmText: '去设置',
          cancelText: '暂不开启',
          success: (r) => {
            if (r.confirm) wx.openSetting();
          }
        });
      }
    });
  },
  selectStore(e) {
    const id = e.currentTarget.dataset.id;
    if (app.setPickupStoreId) app.setPickupStoreId(id);
    wx.navigateBack();
  }
});

