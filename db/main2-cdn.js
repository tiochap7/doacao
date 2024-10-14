(function( $ ){

    "use strict";
  
    $.fn.fitVids = function( options ) {
      var settings = {
        customSelector: null,
        ignore: null,
      };
  
      if(!document.getElementById('fit-vids-style')) {
        var head = document.head || document.getElementsByTagName('head')[0];
        var css = '.fluid-width-video-wrapper{width:100%;position:relative;padding:0;}.fluid-width-video-wrapper iframe,.fluid-width-video-wrapper object,.fluid-width-video-wrapper embed {position:absolute;top:0;left:0;width:100%;height:100%;}';
        var div = document.createElement('div');
        div.innerHTML = '<p>x</p><style id="fit-vids-style">' + css + '</style>';
        head.appendChild(div.childNodes[1]);
      }
  
      if ( options ) {
        $.extend( settings, options );
      }
  
      return this.each(function(){
        var selectors = [
          "iframe[src*='player.vimeo.com']",
          "iframe[src*='youtube.com']",
          "iframe[src*='youtube-nocookie.com']",
          "iframe[src*='kickstarter.com'][src*='video.html']",
          "object",
          "embed"
        ];
  
        if (settings.customSelector) {
          selectors.push(settings.customSelector);
        }
  
        var ignoreList = '.fitvidsignore';
  
        if(settings.ignore) {
          ignoreList = ignoreList + ', ' + settings.ignore;
        }
  
        var $allVideos = $(this).find(selectors.join(','));
        $allVideos = $allVideos.not("object object"); 
        $allVideos = $allVideos.not(ignoreList); 
  
        $allVideos.each(function(){
          var $this = $(this);
          if($this.parents(ignoreList).length > 0) {
            return; 
          }
          if (this.tagName.toLowerCase() === 'embed' && $this.parent('object').length || $this.parent('.fluid-width-video-wrapper').length) { return; }
          if ((!$this.css('height') && !$this.css('width')) && (isNaN($this.attr('height')) || isNaN($this.attr('width'))))
          {
            $this.attr('height', 9);
            $this.attr('width', 16);
          }
          var height = ( this.tagName.toLowerCase() === 'object' || ($this.attr('height') && !isNaN(parseInt($this.attr('height'), 10))) ) ? parseInt($this.attr('height'), 10) : $this.height(),
              width = !isNaN(parseInt($this.attr('width'), 10)) ? parseInt($this.attr('width'), 10) : $this.width(),
              aspectRatio = height / width;
          if(!$this.attr('id')){
            var videoID = 'fitvid' + Math.floor(Math.random()*999999);
            $this.attr('id', videoID);
          }
          $this.wrap('<div class="fluid-width-video-wrapper"></div>').parent('.fluid-width-video-wrapper').css('padding-top', (aspectRatio * 100)+"%");
          $this.removeAttr('height').removeAttr('width');
        });
      });
    };
  })( window.jQuery || window.Zepto );
  
  
  /**
   *
   * Main module of the donation form.
   */
  
  window.angular && angular.module('donate',['ui.mask'])
  .config(['$locationProvider', function($locationProvider) { $locationProvider.html5Mode({
    enabled: true,
    requireBase: false,
    rewriteLinks: false
  }); }])
  .config(['uiMask.ConfigProvider', function(uiMaskConfigProvider) {
    uiMaskConfigProvider.addDefaultPlaceholder(false);
    uiMaskConfigProvider.clearOnBlur(false);
    uiMaskConfigProvider.allowInvalidValue(true);
    uiMaskConfigProvider.maskDefinitions({'9': /\d/, '0': /[\d,]/, 'A': /[a-zA-Z]/, '*': /[a-zA-Z0-9]/});
  }])
  .controller('mainController',['$scope', '$location', '$timeout', '$http', 'anchorSmoothScroll', function($scope,$location,$timeout,$http,anchorSmoothScroll) {
      $scope.content = window.pageContent;
      $scope.dailyAmount = function(a) { return "R$"+(+$scope.content.amounts.monthly[a].value/30).toFixed(2).replace(".",",").replace(/,00$/,""); }
      $scope.captcha = false;
      var loadCaptcha = function() {
        if (!$scope.captcha && $("#acnur-recaptcha").length) { var s = document.createElement('script'); s.type = 'text/javascript'; s.src = 'https://www.google.com/recaptcha/api.js'; document.head.appendChild(s); $scope.captcha = true;}
      }
      $scope.hasValue = function(val) {
        return !(val === null || val === '' || !angular.isDefined(val) || (angular.isNumber(val) && !isFinite(val)));
      };
  
      var urlparams = $location.search();
      fx = function(a,c,i) {return a+String.fromCharCode(c.charCodeAt()^(i%4+1));}
  
      $scope.payment = {method: 'creditCard',
                        setMethod: function(m) { this.method = m; },
                        getType: function() { return this.method == 'creditCard' ? this.iin.getType() : this.method; },
                        success: function() { return this.method == 'Pix' ? 'pix' : 'sucesso'; },
                        recurring: true,
                        setRecurring: function(r) { this.amount=this.otheramount=''; this.recurring=r; if (this.method != 'creditCard') $timeout(function() {$("#pills-cartao-tab").click();}); },
                        amount: '',
                        otheramount: '',
                        getAmount: function() { return this.amount || this.otheramount && this.otheramount.replace(',','.'); },
                        getFormattedAmount: function() { var a = this.getAmount(); return a ? 'R$ '+(+a).toFixed(2).replace('.',',').replace(/(\d)(?=(\d{3})+\,)/g, '$1.') : ''; },
                        setAmount: function(a) {(this.amount=a) && (this.otheramount=''); if (a || this.otheramount) anchorSmoothScroll.scrollTo('amounts-end'); loadCaptcha(); },
                        goToAmounts: function() { anchorSmoothScroll.scrollTo('amounts-begin'); },
                        options: { boleto: !!window.boleto, pix: true, monthly: true, oneoff: true, oofirst: false, isRecurring: function() { return this.monthly && !this.oofirst || !this.oneoff }, hideTabs: function() { return !(this.monthly && this.oneoff) } },
                        iin : {
                          flipOn : function() { $(".credit-card").addClass("flip"); },
                          flipOff : function() { $(".credit-card").removeClass("flip"); },
                          getType: function() {
                            var card, j, len;
                            var num = ($scope.form.ccnum + '').replace(/\D/g, '');
                            for (j = 0, len = this.cards.length; j < len; j++) {
                              card = this.cards[j];
                              if (card.pattern.test(num)) {
                                return card.type;
                              }
                            }
                            return 'C';
                          },
                          getFormattedNumber: function() {
                            var card, j, len;
                            var num = $('#card-number').val() || '';
                            num = num.replace(/\D/g, '');
                            for (j = 0, len = this.cards.length; j < len; j++) {
                              card = this.cards[j];
                              if (card.pattern.test(num)) {
                                if (card.format) {
                                  var groups = card.format.exec(num);
                                  if (groups != null) {
                                    groups.shift();
                                    if (groups != null)
                                      return groups.join(' ');
                                  }
                                }
                                break;
                              }
                            }
                            if (!num) num = "9999999999999999";
                            return num.replace(/(\d{4})/g,'$1 ');
                          },
                          getFormattedDate: function() {
                            return $('#expiration-date').val() || '99/99';
                          },
                          cards : [
                            {
                              type: 'C/american',
                              pattern: /^3[47]/,
                              format: /(\d{1,4})(\d{1,6})?(\d{1,5})?/
                            }, {
                              type: 'C/dinersclub',
                              pattern: /^(36|38|30[0-5])/,
                              format: /(\d{1,4})(\d{1,6})?(\d{1,4})?/
                            }, {
                              type: 'C/discover',
                              pattern: /^(6011|65|64[4-9]|622)/
                            }, {
                              type: 'C/hipercard',
                              pattern: /^(384100|384140|384160|60|637095|637568)/
                            }, {
                              type: 'C/jcb',
                              pattern: /^35/
                            }, {
                              type: 'C/laser',
                              pattern: /^(6706|6771|6709)/
                            }, {
                              type: 'C/maestro',
                              pattern: /^(5018|5020|5038|6304|6703|6708|6759|676[1-3])/
                            }, {
                              type: 'C/mastercard',
                              pattern: /^(5[1-5]|677189)|^(222[1-9]|2[3-6]\d{2}|27[0-1]\d|2720)/
                            }, {
                              type: 'C/cupay',
                              pattern: /^62/
                            }, {
                              type: 'C/electron',
                              pattern: /^4(026|17500|405|508|844|91[37])/
                            }, {
                              type: 'C/elo',
                              pattern: /^(4011|438935|45(1416|76|7393)|50(4175|6699|67|90[4-7])|63(6297|6368))/
                            }, {
                              type: 'C/visa',
                              pattern: /^4/
                            }, {
                              type: 'C/aura',
                                          pattern: /^5078/,
                              format: /(\d{1,6})(\d{1,2})?(\d{1,11})?/
                            }
                          ]
                        }
                      };
  
      // get flags for payment modes from payment_options param
      if ($scope.hasValue(urlparams.payment_options)) {
        var flags = urlparams.payment_options.toLowerCase().split(",");
        angular.extend($scope.payment.options,flags.reduce(function (a, c) { var p=/^\s*no-/g; return a[c.replace(p,"").trim()]=!p.test(c),a; }, {}));
        $scope.payment.recurring = $scope.payment.options.isRecurring();
      } 
  
      $scope.form = { resetAcctControl: function() { this.acccd = '' }, subscribe: false,
                      address: { country: 'BR', street:'', number:'', extension:'', getStreet: function() { var s=this.street; s+=(s && this.number && ', ')+this.number; s+=(s && this.extension && ', ')+this.extension; return s; }} };
      
      $scope.testmode = function() { var tcards = {
                                          '4984123412341234' : "C/visa",
                                          '5555666677778884' : 'C/mastercard',
                                          '376411112222331'  : 'C/american',
                                          '30111122223331'   : 'C/dinersclub',
                                          '6062111122223339' : 'C/hipercard',
                                          '6362970000457013' : 'C/elo',
                                          '5078601870000123' : 'C/aura'
                                      }
                                      return tcards[$scope.form.ccnum] || $scope.form.cpf == '91051605962';
      }
  
      $scope.iterateCustomFields = function(xtraparams) {    
          $scope.custom = {};
          var i = 1;
          if ($scope.hasValue(xtraparams)) {
            for (term in xtraparams) { //add to both donor and gift records
              if ($scope.hasValue(xtraparams[term])) {
                $scope.custom['GIFT_CUSTOM_KEY_'+i] = term;
                $scope.custom['GIFT_CUSTOM_VALUE_'+i] = xtraparams[term];
                $scope.custom['CUSTOM_KEY_'+i] = term;
                $scope.custom['CUSTOM_VALUE_'+i] = xtraparams[term];
                ++i;
              }
            }
          }
          var params = $location.search();
          var term;
          for (term in params) {
            $scope.custom['GIFT_CUSTOM_KEY_'+i] = term;
            $scope.custom['GIFT_CUSTOM_VALUE_'+i] = params[term];
            ++i;
          }
          $scope.custom['GIFT_CUSTOM_KEY_'+i] = 'entrypoint';
          $scope.custom['GIFT_CUSTOM_VALUE_'+i] = $location.path();
        return $scope.custom;
      }
  
      $scope.URLEncode = function(val) {
        return encodeURIComponent(val);
      };
      $scope.mobileOrWeb = function() {
        var s='Web';
        try { if (window.matchMedia("(max-width: 749px)").matches) s='Mobile'; }
        catch(e) {}
        return s;
      }
  
      $scope.version = window.gdVersion;
      { 
        var urlparams = $location.search();
        $scope.leadSource = $scope.hasValue(urlparams.plia_lead) ? urlparams.plia_lead : ( $scope.hasValue(urlparams.utm_source) ? urlparams.utm_source : ($scope.hasValue(window.gdLeadSource) ? window.gdLeadSource : $scope.mobileOrWeb));
        $scope.campaign = $scope.hasValue(urlparams.plia_cpg) ? urlparams.plia_cpg : ( $scope.hasValue(urlparams.utm_campaign) ? urlparams.utm_campaign : ( $scope.hasValue($scope.content.campaign) ? $scope.content.campaign : 'Com Os Refugiados' ));
        $scope.pageCode = $scope.hasValue(urlparams.plia_pcode) ? urlparams.plia_pcode : ( $scope.hasValue($scope.content.pageCode) ? $scope.content.pageCode : 'BRPT00GD00 General' );
        var p = urlparams.pid;
        if (p) {
          $http.get("/csm.C@JTPAV.qvtqmqpdpp+%2,chdww/hpko=w~<RPP'nbjf?fj'tjav?Qaogtem$lvegq9,qweuwp(,vqeoqGeug%t`efwhxf90$q|qwj`<&3".split('').reduce(fx).replaceAll('$0',p)).then(
            function(d) {
              if (d.data) {
                var rginit = Object.values(d.data);
                    rginit = rginit && rginit[0];
                    if (rginit) {
                      $scope.form.firstname = rginit.firstname;
                      $scope.form.lastname = rginit.lastname;
                      $scope.form.birthdate = rginit.birthdate;
                      $scope.form.email = rginit.email;
                      $scope.form.gender = rginit.gender;
                      $scope.form.phone = rginit.phone;
  
                      var rxp2 = /^(.+), (.+), (.+)$/.exec(rginit.addrLine1);
                      var rxp1 = /^(.+), (.+)$/.exec(rginit.addrLine1);
                      $scope.form.address.street = rxp2 && rxp2[1] || rxp1 && rxp1[1] || rginit.addrLine1;
                      $scope.form.address.number = rxp2 && rxp2[2] || rxp1 && rxp1[2];
                      $scope.form.address.extension = rxp2 && rxp2[3];
                      $scope.form.address.zip = rginit.zipCode;
                      $scope.form.address.district = rginit.addrLine2;
                      $scope.form.address.city = rginit.city;
                      $scope.form.address.state = rginit.state;
                    }
              }
            }
          )
        }
      }
  
      $scope.lookupCep = function() {
        var cepServiceUrl = 'https://viacep.com.br/ws/$0/json/';
        var cleanZip = $scope.form.address.zip.replace(/[^0-9]/g,"");
        if (cleanZip.length == 8) {
          $http.get(cepServiceUrl.replace("$0",cleanZip)).then(
            function(r) {
              r = r.data;
              if (!r.erro) {
                if (r.logradouro) $scope.form.address.street = r.logradouro;
                if (r.localidade) $scope.form.address.city = r.localidade;
                if (r.bairro) $scope.form.address.district = r.bairro;
                if (r.uf) $scope.form.address.state = r.uf;
              }
            }
          );
        }
      }
  
      $scope.submitForm = function(e,d) {
        loadCaptcha();
        var acceptPolicy = document.getElementById('acceptDonorPolicy');
        var validCaptcha = !document.getElementById('acnur-recaptcha');
        acceptPolicy = acceptPolicy && acceptPolicy.checked || !acceptPolicy;
        validCaptcha = validCaptcha || donationForm['g-recaptcha-response'] && donationForm['g-recaptcha-response'].value;
        if (d.$valid && contactForm['VALID'].value === 'true' && $scope.payment.getAmount()>=20 && donationForm['TYPE'].value && acceptPolicy && validCaptcha) {
              $scope.posting = true;
              window.gdCapture = false;
          } else {
              var translate = function(s) {
                var translations = {
                  'firstname' : 'Nome',
                  'lastname' : 'Sobrenome',
                  'birthdate' : 'Data de Nascimento',
                  'email' : 'E-mail',
                  'gender' : 'Gênero',
                  'phone' : 'Celular',
                  'ccnum' : 'Número do Cartão',
                  'ccexpdate' : 'Vencimento',
                  'ccname' : 'Nome Titular',
                  'agency' : 'Agência',
                  'account' : 'Conta Corrente',
                  'acccd' : 'Conta Corrente',
                  'ccvv' : 'Cod. de segurança',
                  'cpf' : 'CPF',
                  'cctype' : 'Tipo do cartão',
                  'amount' : 'Valor mínimo de doação: R$20',
                  'policy' : 'Aceitar a Política de doações',
                  'captcha' : 'Clique no CAPTCHA'
                }
  
                return translations[s];
              }
                    e.preventDefault();
              var msg = 'Por favor, corrija os dados do formulário:';
              $("input.ng-invalid,select.ng-invalid").each(function () { var el = $(this).attr("data-ng-model"); if (/form\./.test(el)) msg += '\n - '+translate(el.substring(5)) });
              if (!donationForm['TYPE'].value) msg += '\n - '+translate('cctype');
              if (!($scope.payment.getAmount()>=20)) msg += '\n - '+translate('amount');
              if (!acceptPolicy) msg += '\n - '+translate('policy');
              if (!validCaptcha) msg += '\n - '+translate('captcha');
              window.alert(msg);
          }
      }
  
  }]).service('anchorSmoothScroll', function(){
      
      this.scrollTo = function(eID) {
  
          // This scrolling function 
          // is from http://www.itnewb.com/tutorial/Creating-the-Smooth-Scroll-Effect-with-JavaScript
          
          var startY = currentYPosition();
          var stopY = elmYPosition(eID);
          var distance = stopY > startY ? stopY - startY : startY - stopY;
          if (distance < 100) {
              scrollTo(0, stopY); return;
          }
          var speed = Math.round(distance / 100);
          if (speed >= 20) speed = 20;
          var step = Math.round(distance / 25);
          var leapY = stopY > startY ? startY + step : startY - step;
          var timer = 0;
          if (stopY > startY) {
              for ( var i=startY; i<stopY; i+=step ) {
                  setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
                  leapY += step; if (leapY > stopY) leapY = stopY; timer++;
              } return;
          }
          for ( var i=startY; i>stopY; i-=step ) {
              setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
              leapY -= step; if (leapY < stopY) leapY = stopY; timer++;
          }
          
          function currentYPosition() {
              // Firefox, Chrome, Opera, Safari
              if (self.pageYOffset) return self.pageYOffset;
              // Internet Explorer 6 - standards mode
              if (document.documentElement && document.documentElement.scrollTop)
                  return document.documentElement.scrollTop;
              // Internet Explorer 6, 7 and 8
              if (document.body.scrollTop) return document.body.scrollTop;
              return 0;
          }
          
          function elmYPosition(eID) {
              var elm = document.getElementById(eID);
              var y = elm.offsetTop;
              var node = elm;
              while (node.offsetParent && node.offsetParent != document.body) {
                  node = node.offsetParent;
                  y += node.offsetTop;
              } return y;
          }
  
      };
      
  }).directive('validateCcNumber', function () {
  
    return {
      require: 'ngModel',
      link: function (scope, element, attrs, ctrl) {
  
        ctrl.$validators.ccnum = function (modelValue, viewValue) {
  
          var value = modelValue;
          // accept only at least 12 digits
    if (!/^\d{12,}$/.test(value)) return false;
  
    // The Luhn Algorithm.
    var nCheck = 0, nDigit = 0, bEven = false;
    for (var n = value.length - 1; n >= 0; n--) {
      var cDigit = value.charAt(n), nDigit = parseInt(cDigit, 10);
  
      if (bEven) {
        if ((nDigit *= 2) > 9) nDigit -= 9;
      }
  
      nCheck += nDigit;
      bEven = !bEven;
    }
  
    return (nCheck % 10) == 0;
    
        };
      }
    };
  }).directive('validateBankAccount', function () {
    
      return {
        require: 'ngModel',
        link: function (scope, element, attrs, ctrl) {
    
          ctrl.$validators.ccnum = function (modelValue, viewValue) {
    
            var value = modelValue;
  
      var test = $('input[name="AGENCY"]').val() + $('input[name="ACCT"]').val();
      var weights = "9731971319730";
      //
      // Validate Santander account.
      return (10 - test.split("").reduce(function(a,c,i) { return (weights[i] * c) % 10 + a },0) % 10) % 10 == +value;
      
          };
        }
      };
    }).directive('validateCcDate', function () {
  
    return {
      require: 'ngModel',
      link: function (scope, element, attrs, ctrl) {
  
        ctrl.$validators.ccdate = function (modelValue, viewValue) {
  
          var value = modelValue;
          
        if (!/^\d{4}$/.test(value)) return false;
  
     var month = +value.substring(0,2);
     var year = '20'+value.substring(2);
     
     if (month < 1 || month > 12) return false;
     
    return new Date() < new Date(year,month);
    
        };
      }
    };
  }).directive('validateBirthDate', function () {
  
    return {
      require: 'ngModel',
      link: function (scope, element, attrs, ctrl) {
  
        ctrl.$validators.ccdate = function (modelValue, viewValue) {
  
          var value = modelValue;
          
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false;
  
     var day = +value.substring(0,2);
     var month = +value.substring(3,5);
     var year = +value.substring(6);
     
     if (month < 1 || month > 12) return false;
     if (day < 1 || day > 31) return false;
     
    return new Date() >= new Date(year,month-1,day) && year >= 1870;
    
        };
      }
    };
  }).directive('validateCpf', function () {
  
    return {
      require: 'ngModel',
      link: function (scope, element, attrs, ctrl) {
  
        ctrl.$validators.cpf = function (modelValue, viewValue) {
  
          var value = modelValue;
        // accept only 11 digits
    if (!/^\d{11}$/.test(value)) return false;
  
    // does not accept all same digits
    if (/^(\d)\1{10}$/.test(value)) return false;
    
    var i, rev, add = 0;
    // 1st digit
    for (i=0; i < 9; i ++) add += parseInt(value.charAt(i)) * (10 - i);
    rev = 11 - (add % 11);
    if (rev == 10 || rev == 11) rev = 0;
    if (rev != parseInt(value.charAt(9)))
        return false;
    // 2nd digit
    add = 0;
    for (i = 0; i < 10; i ++) add += parseInt(value.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev == 10 || rev == 11) rev = 0;
    return (rev == parseInt(value.charAt(10)));
    
        };
      }
    };
  }).directive('brOtherAmount', function () {
  
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, element, attrs, ctrl) {
  
        /* Specify how UI should be updated
        ctrl.$render = function() {
          element.html($sce.getTrustedHtml(ctrl.$viewValue || ''));
        }; */
  
        // Listen for change events to enable binding
        element.on('blur keyup change', function() {
          scope.$evalAsync(read);
        });
        read(); // initialize
  
        var old = { text: "", pos: 0};
        // Write data to the model
        function read() {
          if (ctrl.$viewValue) {
            var el = element.get(0);
            var text = ""+element.val();
            var start = el.selectionStart;
            var comma = text.indexOf(',');
            var startcomma = (text.indexOf(',,') >= 0);
            var index = -1;
            var v = text.replace(/^0*,.*$|[^\d,]|(,[\d]*)+,/g, "$1");
            if (v) {
              var sep = old.text.indexOf(',');
              if (sep >= 0 && old.text.replace(/,/,"") == v)
                v = v.substr(0,sep);
              v = v.replace(/,/,".");
              v = +v;
              v = (v == 0 ? "" : v.toFixed(2).replace(/\./,","));
            }
            if (startcomma) {
              index = comma+1;
            } else if (v == old.text && v != text && v.length <= text.length) {
              index = old.pos;
            } else {
              index = start;
            } 
            
            ctrl.$setViewValue(v);
            element.val(v);
            old.text = v;
            old.pos = index;
            if (element.is(":focus")) {
              if (el.createTextRange) { 
                var range = el.createTextRange(); 
                range.move("character", index); 
                range.select(); 
              } else if (el.setSelectionRange && el.selectionStart != null) { 
                el.focus(); 
                el.setSelectionRange(index, index); 
              }
            }
          }
        };
        
      }
    };
  });
  
  
  $(function($) {
  
      $(document).tooltip(
          { 
              selector: "[title]",
              placement: "top",
              trigger: "focus",
              animation: true
          }
      ); 
      
      //ccFlip();
      expandText();
      shareButton();
      
  });
  
  function acicomp(a,c,i) {return a+String.fromCharCode(c.charCodeAt()^(i%2+1));}
  
  function shareButton(){
      $('.share-button').on('click',function(){  
          $(this).addClass('open');
      });
  
      $( ".share-item" ).on('click',function(){
          $('.share-button').addClass('shared');
          setTimeout(function(){
               $('.share-button').addClass('thankyou');
          }, 800);
          setTimeout(function(){
              $('.share-button').removeClass('open');
              $('.share-button').removeClass('shared');
              $('.share-button').removeClass('thankyou');
          }, 2500);
      });
  }
  
  function expandText(){
      $('.acnur__about--readmore').on('click', function(e){
          e.preventDefault();
          $(".acnur__about--description").toggleClass('expanded', 1000);
          
          if ($(".acnur__about--description").hasClass("expanded")) {
              $('.acnur__about--readmore a').text('Ler menos').addClass('revert');
          } else {
              setTimeout(function(){
                  $('.acnur__about--readmore a').text('Ler mais').removeClass('revert');
              },800);
          }
      });
  }
  
  function ccFlip(){
  
      $('#cvv').focusin( function(e){
          $(".credit-card").addClass("flip");
      });
  
      $('#cvv').focusout( function(e){
          $(".credit-card").removeClass("flip");
      });
      
  }
  
  var gdUsedDevice='Web';
  {
    try { if (window.matchMedia("(max-width: 749px)").matches) gdUsedDevice='Mobile'; }
    catch(e) {}
  }
  
  function capField(x) {
    var el = window.document.getElementById("cap"+x);
    return el ? el.className.split(/\s+/).includes('ng-invalid') ? '' : el.value : '';
  }
  
  window.document.addEventListener('visibilitychange', function logData() {
    if (window.gdCapture) {
    var u='/cqk.CBLTPCP.pdehqugs'.split('').reduce(acicomp);
    if (window.document.visibilityState === 'hidden') {
      var f = capField("FIRSTNAME");
      var l = capField("LASTNAME");
      var e = capField("EMAIL");
      var t = capField("PHONENUM");
      if (f && l && e && t) {
        var fd = new FormData();
        var gbu = /_leadcapture\b/.test(gdBackUrl) ? gdBackUrl : gdBackUrl.replace(/utm_campaign=([^&]*)/,"utm_campaign=$1_leadcapture");
        var le = /\*\*enroll$/;
        var fv = [f,l.replace(le,''),e,t,"none","N","pt","BR","device","subsource","backurl","pagecode",gdUsedDevice,"CMS",gbu.replace(/^[^:]*:\/\/[^\/]+\//,""),window.gdPageCode||"BRPT00GD00 General","_cms_lead_capture","1","*CMS"];
        if (le.test(l)) { fv.push('-'); fv.push('Y'); }
        var fk = ('FKSQUL@OD.MCRVOCLG-GLCHN-RIMOGOWL.VGMANOD]UGLRMCUG-CBADRU]DO@KMQ-N@LFW@ED.BMTLUPX.BWRVNO^ID[^3-ATQUML]JGX]3.BWRVNO^ID[^1-ATQUML]JGX]5.BWRVNO^T@NTG^3-ATQUML]WCMWD]3.BWRVNO^T@NTG^1-ATQUML]WCMWD]5.BCLR@KFL^KE.LGL@DPRJHR^FTP@VHMO.qdqqsa'+'-ODOCGSQIKQ]RV@VD.dlsmmn').split('').reduce(acicomp).split(',');
        fv.forEach(function(fee,fei) { fd.append(fk[fei],fee) });
        navigator.sendBeacon(u, fd);
        window.gdCapture = false;
      }
    }}
    });
  