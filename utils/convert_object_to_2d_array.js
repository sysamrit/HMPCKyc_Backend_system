function convertObjectToArray(data) {
  return data.map(row => Object.values(row));
}

module.exports = {convertObjectToArray}