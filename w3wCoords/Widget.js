///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'dojo/_base/html',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'jimu/dijit/Message',
    'dojo/_base/lang',
    'dojo/on',
    "dojo/dom-class",
    "dojo/aspect",
    "esri/request",
    "esri/graphic",
    "esri/layers/GraphicsLayer",
    "esri/symbols/PictureMarkerSymbol",
    "esri/config",
    "libs/usng/usng",
    "dijit/form/CheckBox"
  ],
  function(
    declare,
    html,
    _WidgetsInTemplateMixin,
    BaseWidget,
    Message,
    lang,
    on,
    domClass,
    aspect,
    esriRequest,
    Graphic,
    GraphicsLayer,
    PictureMarkerSymbol,
    esriConfig,
    usng,
    CheckBox
  ) {
    
    
    /**
     * The Coordinate widget displays the current mouse coordinates.
     * If the map's spatial reference is geographic or web mercator,
     * the coordinates can be displayed as
     * decimal degrees or as degree-minute-seconds.
     * Otherwise, the coordinates will show in map units.
     *
     * @module widgets/Coordinate
     */
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
      /**
      * realtime: {
      *   102100: all unit,
      *   4326: geoUnit,usng,mgrs,
      *   projCS: projUnit,
      *   geoCS: geoUnit,usng,mgrs,
      * }
      * click: {
      *   projectCS: {
      *     geoUnit:  convert to ellipsoidal coordinates,
      *     projUnit: convert on client,
      *     usng、mgrs: get longtitude and latitude, then convert to usng/mgrs on client,
      *   },
      *   geoCS: {
      *     geoUnit: convert to ellipsoidal coordinates,
      *     usng、mgrs: get longtitude and latitude, then convert to usng/mgrs on client
      *   }
      * }
      */

      baseClass: 'jimu-widget-coordinate',
      name: 'Coordinate',
      enablew3w: false,
      geoServiceUrl: null,

      _configured: false,
      _w3wmarkerGraphic: null,
      _w3wgraphicLayer : null,

      postMixInProperties: function() {
        this.nls.enableClick = this.nls.enableClick ||
          "Haz clic para habilitar la obtención de coordenadas al hacer clic en el mapa";
        this.nls.disableClick = this.nls.disableClick ||
          "Haz clic para deshabilitar la obtención de coordenadas al hacer clic en el mapa";
      },

      postCreate: function() {
        this.inherited(arguments);
        domClass.add(this.coordinateBackground, "coordinate-background");
        this.own(on(this.map, "click", lang.hitch(this, this.onMapClick)));
        this.own(on(this.locateButton, "click", lang.hitch(this, this.onLocateButtonClick)));
        this._w3wgraphicLayer = new GraphicsLayer();
        this.map.addLayer(this._w3wgraphicLayer);
      },

      startup: function() {
        this.inherited(arguments);
      },

      onLocateButtonClick: function() {
        html.removeClass(this.coordinateInfoMenu, 'coordinate-info-menu-empty');
        html.toggleClass(this.locateContainer, 'coordinate-locate-container-active');
        this._w3wgraphicLayer.remove(this._w3wmarkerGraphic);
        this._w3wmarkerGraphic = null;
        if (this.enablew3w) {
          this.enablew3w = false;
          this.coordinateInfo.innerHTML = this.nls.enableClick;
          html.setAttr(this.locateButton, 'title', this.nls.disableClick);
        } else {
          this.enablew3w = true;
          this.coordinateInfo.innerHTML = this.nls.hintMessage;
          html.setAttr(this.locateButton, 'title', this.nls.enableClick);
        }
  
      },

      onDeActive: function() {
        if (html.hasClass(this.locateContainer, 'coordinate-locate-container-active')) {
          this.onLocateButtonClick();
        }
      },

      _getMarkerGraphic: function(mapPoint) {
        var symbol = new PictureMarkerSymbol(
          this.folderUrl + "css/images/w3w.png",
          45, 45
          );
        symbol.setOffset(0, 12);
        return new Graphic(mapPoint, symbol);
      },

      onMapClick: function(evt) {
        if (!this.enablew3w) {
          return;
        }
        this._displayOnClient(evt.mapPoint);
        this._w3wgraphicLayer.remove(this._w3wmarkerGraphic);
        this._w3wmarkerGraphic = this._getMarkerGraphic(evt.mapPoint);
        this._w3wgraphicLayer.add(this._w3wmarkerGraphic);
      },

      _getw3w : function(mapPoint){
        var x = mapPoint.getLongitude().toFixed(5), y = mapPoint.getLatitude().toFixed(5);
        pos = ""+y+","+x;

        esriConfig.defaults.io.corsEnabledServers.push("api.what3words.com");
        esriRequest({url: "https://api.what3words.com/position?key=28MUDALQ&position="+y+"%2C"+x+"&lang=es"}).then(function(result){
          dojo.byId("coordinateInfo2").innerHTML = result.words;
        })
      },

      _displayOnClient: function(mapPoint) {
        this._getw3w(mapPoint);
      },

      destroy: function() {
        if (this._w3wmarkerGraphic) {
          this._w3wgraphicLayer.remove(this._w3wmarkerGraphic);
        }
        if (this._w3wgraphicLayer) {
          this.map.removeLayer(this._w3wgraphicLayer);
        }

        this.inherited(arguments);
      },

      onFoldContainerClick: function() {
        if (this._configured) {
          html.toggleClass(this.coordinateMenuContainer, 'display-coordinate-menu');
        }
      },
    });

    return clazz;
  });