import { register } from '../index.js';
register({ id:'inventory.stock-on-hand', version:1, title:{ ar:'الرصيد المخزني', en:'Stock on Hand' }, category:'inventory', requiredPermission:'reports.inventory.stock.read', dataSources:[{ module:'inventory', service:'stockQueries.onHand()', tables:['item_stock','stock_moves'], purpose:{ ar:'مخزون', en:'stock' } }] });
