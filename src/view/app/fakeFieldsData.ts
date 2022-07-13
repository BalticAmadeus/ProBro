import faker from "faker";

function createFakeRow(index) {
  return {
    order: faker.datatype.number(),
    name: faker.name.firstName(),
    type: faker.name.firstName(),
    format: faker.name.firstName(),
    label: faker.name.firstName(),
    initial: faker.name.firstName(),
  };
}

export default function createRowData(count) {
  return [...Array(count).keys()].map(i => createFakeRow(i));
}
