-- CARBUGUI only tracks essence and gasoil; gaz (butane) is out of scope.
-- Drop every row referencing it before narrowing the enum, since MySQL
-- rejects a value that's still in use.
DELETE FROM `station_products` WHERE `product` = 'GAZ';
DELETE FROM `station_activities` WHERE `product` = 'GAZ';
DELETE FROM `station_reports` WHERE `product` = 'GAZ';
DELETE FROM `search_events` WHERE `product` = 'GAZ';

ALTER TABLE `station_products` MODIFY `product` ENUM('ESSENCE', 'GASOIL') NOT NULL;
ALTER TABLE `station_activities` MODIFY `product` ENUM('ESSENCE', 'GASOIL') NULL;
ALTER TABLE `station_reports` MODIFY `product` ENUM('ESSENCE', 'GASOIL') NULL;
ALTER TABLE `search_events` MODIFY `product` ENUM('ESSENCE', 'GASOIL') NOT NULL;
