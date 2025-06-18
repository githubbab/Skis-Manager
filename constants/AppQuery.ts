export default {
  topUsers: "SELECT \
        CONCAT('topUsers-',itemsUsers.id) as key, itemsUsers.name as name, itemsUsers.picture as picture, itemsUsers.pcolor as pcolor, COUNT(DISTINCT eventsOutings.date / 10) AS nb \
        FROM itemsUsers INNER JOIN eventsOutings ON itemsUsers.id = eventsOutings.idUser \
        WHERE eventsOutings.date >= ( \
          SELECT CAST(value AS INTEGER) \
        FROM settings WHERE name = 'seasonDate' LIMIT 1 ) \
        GROUP BY itemsUsers.id, itemsUsers.name \
        ORDER BY nb DESC",
  topSkis: "SELECT \
        CONCAT('topSkis-',itemsSkis.id) AS key, itemsSkis.idBrand AS brand, itemsSkis.name AS name, typeOfSkis.id AS idStyle, \
        typeOfSkis.name AS style, GROUP_CONCAT(DISTINCT itemsUsers.name) AS users, COUNT(DISTINCT eo.date / 10) AS nb \
      FROM eventsOutings AS eo \
      JOIN itemsSkis ON itemsSkis.id = eo.idSkis \
      JOIN typeOfSkis ON itemsSkis.idTypeOfSkis = typeOfSkis.id \
      LEFT JOIN joinSkisUsers ON joinSkisUsers.idSkis = itemsSkis.id \
      LEFT JOIN itemsUsers ON itemsUsers.id = joinSkisUsers.idUser \
      WHERE eo.date >= ( \
        SELECT CAST(value AS INTEGER) \
      FROM settings WHERE name = 'seasonDate' LIMIT 1 ) \
      GROUP BY itemsSkis.id \
      ORDER BY nb DESC",
  toSharp: "SELECT \
        CONCAT('toSharp-',itemsSkis.id) AS key, itemsSkis.idBrand AS brand, itemsSkis.name AS name, typeOfSkis.id AS idStyle, typeOfSkis.name AS style,\
        GROUP_CONCAT(DISTINCT itemsUsers.name) AS users, (COUNT(DISTINCT eo.date / 10) - typeOfSkis.sharpNeed) AS nb\
      FROM eventsOutings eo \
         JOIN itemsSkis ON itemsSkis.id = eo.idSkis\
         JOIN typeOfSkis ON itemsSkis.idTypeOfSkis = typeOfSkis.id\
         LEFT JOIN joinSkisUsers ON joinSkisUsers.idSkis = itemsSkis.id\
         LEFT JOIN itemsUsers ON itemsUsers.id = joinSkisUsers.idUser\
      WHERE eo.date >= IFNULL(\
        (SELECT MAX(eventsMaintains.date)\
         FROM eventsMaintains\
                  JOIN typeOfMaintains ON eventsMaintains.idMaintainType = typeOfMaintains.id\
         WHERE typeOfMaintains.swr LIKE '%S%'),0)\
      GROUP BY itemsSkis.id \
      HAVING nb >= 0 \
      ORDER BY nb DESC",
  toWax: "SELECT \
        CONCAT('toWax-',itemsSkis.id) AS key, itemsSkis.idBrand AS brand, itemsSkis.name AS name, typeOfSkis.id AS idStyle, typeOfSkis.name AS style, \
        GROUP_CONCAT(DISTINCT itemsUsers.name) AS users, (COUNT(DISTINCT eo.date / 10) - typeOfSkis.waxNeed) AS nb \
      FROM eventsOutings eo \
      JOIN itemsSkis ON itemsSkis.id = eo.idSkis \
      JOIN typeOfSkis ON itemsSkis.idTypeOfSkis = typeOfSkis.id \
      LEFT JOIN joinSkisUsers ON joinSkisUsers.idSkis = itemsSkis.id \
      LEFT JOIN itemsUsers ON itemsUsers.id = joinSkisUsers.idUser \
      WHERE eo.date >= IFNULL( \
        (SELECT MAX(eventsMaintains.date)\
         FROM eventsMaintains\
                  JOIN typeOfMaintains ON eventsMaintains.idMaintainType = typeOfMaintains.id\
         WHERE typeOfMaintains.swr LIKE '%W%'),0) \
      GROUP BY itemsSkis.id \
      HAVING nb >= 0\
  ORDER BY nb DESC",
  listSkis: "SELECT \
        itemsSkis.id AS key, itemsSkis.idBrand AS brand, itemsSkis.name AS name, \
        itemsSkis.begin AS begin, itemsSkis.end AS end, typeOfSkis.name AS style, typeOfSkis.id AS idStyle, \
        itemsSkis.size as size, itemsSkis.radius AS radius, itemsSkis.waist AS waist, \
        GROUP_CONCAT(DISTINCT itemsUsers.name) AS users, GROUP_CONCAT(DISTINCT itemsBoots.name) AS boots, \
        COUNT(DISTINCT eo.date / 10) AS outing \
      FROM itemsSkis  \
      JOIN typeOfSkis ON itemsSkis.idTypeOfSkis = typeOfSkis.id \
      LEFT JOIN joinSkisUsers ON joinSkisUsers.idSkis = itemsSkis.id \
      LEFT JOIN itemsUsers ON itemsUsers.id = joinSkisUsers.idUser \
      LEFT JOIN joinSkisBoots ON joinSkisBoots.idSkis = itemsSkis.id \
      LEFT JOIN itemsBoots ON itemsBoots.id = joinSkisBoots.idBoots \
      LEFT JOIN eventsOutings AS eo ON itemsSkis.id = eo.idSkis \
      GROUP BY itemsSkis.id \
      ORDER BY begin DESC",
}