let settings = {
  filter: {type: "", value: "" },
  primarySensor: { id: 56, threshold: [20, 40] },
  indexView: ["name", "name", "name", "tags", "id", "last_update"],
};

// let settings = {
//   title: "Smart Citizen Dashboard",
//   logo: "logo-sc.svg",
//   filter: { search: true, type: "", value: "" },
//   // primarySensor: { id: 56, threshold: [20, 40] },
//   indexView: ["name", "city", "user", "tags", "id", "last_update"],
//   // https://developer.smartcitizen.me/#get-historical-readings
//   plots: {
//     rollup: '1m',
//     delta_days: 5,
//     labelsize: 11,
//     height_ratio: 1/3,
//     show_last_reading: false,
//   },
//   sensors: [
//     { id: 56, threshold: [20, 40] },
//     { id: 56, threshold: [40, 20] },
//     { id: 56, threshold: [20, 40] },
//     { id: 56, threshold: [40, 20] },
//   ],
//   styles: {
//     colorBase: "#000000",
//     colorBody: "#ffffff",
//     colorAction: "#0065ff",
//     colorBackground: "#dfdfdf",
//   },
// };

// let settings = {
//   title: "CO-MIDA Dashboard",
//   logo: "logo-random.svg",
//   filter: { search: false, type: "city", value: "Barcelona" },
//   primarySensor: { id: 56, threshold: [20, 40] },
//   // indexView: ["name","last_update"],
//   indexView: ["name", "city", "user", "tags", "id", "last_update"],
//   sensors: [
//     { id: 56, threshold: [20, 40] },
//     { id: 56, threshold: [40, 20] },
//     { id: 56, threshold: [20, 40] },
//     { id: 56, threshold: [40, 20] },
//   ],
//   plots: {
//     rollup: '1m',
//     delta_days: 5,
//     labelsize: 11,
//     height_ratio: 1 / 3,
//     show_last_reading: false,
//   },
//   styles: {
//     colorBase: "#000000",
//     colorBody: "#ffffff",
//     colorAction: "#0065ff",
//     colorBackground: "#dfdfdf",
//   },
// };

// filter: { search: false, type: "user", value: "IAAC-Cristian_Rizzuti" },