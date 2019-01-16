import { Injectable } from '@angular/core';
import { LANGUAGES } from './app-data-languages';
import { JszipService } from '../lib/services/jszip.service';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class AppData {
  public languages: any = LANGUAGES;

  public previewSrc: any;
  public previewData = {
    id: 1,
    name: '',
    options: {
      logo: '',
      social: ''
    },
    refresh: 0
  };

  constructor(private jszip: JszipService, public sanitizer: DomSanitizer) {
    let copyLanguages = this.languages;
    copyLanguages = this.checkAll(copyLanguages);
    this.languages = copyLanguages;
  }

  public checkAll(languagesObj: any) {
    let copyLanguages = languagesObj;

    copyLanguages = this.checkEmptyLanguages(copyLanguages);
    copyLanguages = this.checkTemplatesTags(copyLanguages);
    copyLanguages = this.trimHtml(copyLanguages);

    return copyLanguages;
  }

  // set/update languages[x].empty
  public checkEmptyLanguages(languagesObj: any) {
    const languagesClone = languagesObj;

    for (const langId in languagesClone) {
      let emptyLanguage = true;
      const thisLanguage = languagesClone[langId];

      for (const emailId in thisLanguage.emails.templates) {
        if (thisLanguage.emails.templates[emailId].html.trim().length > 0) {
          emptyLanguage = false;
        }
      }
      thisLanguage.empty = emptyLanguage;
    }
    return languagesClone;
  }

  // set/update languages[x].emails.header.tags,
  //    languages[x].emails.footer.tags,
  //    languages[x].emails.templates[x].tags
  public checkTemplatesTags(languagesObj: any) {
    const languagesClone = languagesObj;

    for (const langId in languagesClone) {
      const thisLanguage = languagesClone[langId];

      // set header 'tags' property
      thisLanguage.emails.header.tags = {
        empty: thisLanguage.emails.header.html.trim().length === 0
      };

      // set footer 'tags' property
      thisLanguage.emails.footer.tags = {
        empty: thisLanguage.emails.footer.html.trim().length === 0
      };

      for (const emailId in thisLanguage.emails.templates) {

        // set template 'tags' property
        thisLanguage.emails.templates[emailId].tags = {
          empty: thisLanguage.emails.templates[emailId].html.trim().length === 0,
          noSubject: thisLanguage.emails.templates[emailId].subject.trim().length === 0,
          customHeader: typeof thisLanguage.emails.templates[emailId].header === 'undefined' ? false : true,
          customFooter: typeof thisLanguage.emails.templates[emailId].footer === 'undefined' ? false : true
        };

        // set custom header 'tags' property
        if (typeof thisLanguage.emails.templates[emailId].header !== 'undefined') {
          thisLanguage.emails.templates[emailId].header.tags = {
            empty: thisLanguage.emails.templates[emailId].header.html.trim().length === 0
          };
        }
        // set custom footer 'tags' property
        if (typeof thisLanguage.emails.templates[emailId].footer !== 'undefined') {
          thisLanguage.emails.templates[emailId].footer.tags = {
            empty: thisLanguage.emails.templates[emailId].footer.html.trim().length === 0
          };
        }
      }
    }
    return languagesClone;
  }

  // get language struct by key 'es'
  public getLanguage(key: string) {
    const languagesClone = this.languages;
    let findedLang: any = {};
    let _langId: any;

    for (const langId in this.languages) {
      const thisLanguage = languagesClone[langId];

      if (thisLanguage.key === key) {
        findedLang = thisLanguage;
        _langId = langId;
      }
    }

    findedLang.id = _langId;

    return findedLang;
  }

  // get language id by key 'es'
  public getLangIdByKey(key: string) {
    const languagesClone = this.languages;
    let findedLangId: any;

    for (const langId in this.languages) {
      const thisLanguage = languagesClone[langId];

      if (thisLanguage.key === key) {
        findedLangId = langId;
      }
    }

    return findedLangId;
  }

  // get email data by lang key 'es' and email id 1
  public getEmailData(langKey: string, emailId: any) {
    const langData = this.getLanguage(langKey);
    let emailData: any;

    for (const templateId in langData.emails.templates) {
      const thisTemplate = langData.emails.templates[templateId];

      if (parseInt(templateId) === parseInt(emailId)) {
        emailData = thisTemplate;
      }
    }

    return emailData;
  }

  // set string value 'html' or 'subject'
  public setStringVal(langKey: string, path: string, code: string) {
    let evalPath = 'this.languages';
    for (const langId in this.languages) {
      if (this.languages[langId].key === langKey) {
        evalPath += '[' + langId + ']';
      }
    }

    path.split('.').forEach(valueKey => {
      evalPath += '.' + valueKey;
    });

    const toEval = evalPath + '=`' + code + '`;';
    eval(toEval);

    this.languages = this.checkAll(this.languages);
  }

  // trim all html contents first empty '\n'
  public trimHtml(languagesObj: any) {
    const languagesClone = languagesObj;

    for (const langId in languagesClone) {
      const thisLanguage = languagesClone[langId];

      thisLanguage.emails.header.html = thisLanguage.emails.header.html.replace(/^\n{1}/i, '');
      thisLanguage.emails.footer.html = thisLanguage.emails.footer.html.replace(/^\n{1}/i, '');

      for (const emailId in thisLanguage.emails.templates) {

        thisLanguage.emails.templates[emailId].html = thisLanguage.emails.templates[emailId].html.replace(/^\n{1}/i, '');

        if (typeof thisLanguage.emails.templates[emailId].header !== 'undefined') {
          thisLanguage.emails.templates[emailId].header.html = thisLanguage.emails.templates[emailId].header.html.replace(/^\n{1}/i, '');
        }
        if (typeof thisLanguage.emails.templates[emailId].footer !== 'undefined') {
          thisLanguage.emails.templates[emailId].footer.html = thisLanguage.emails.templates[emailId].footer.html.replace(/^\n{1}/i, '');
        }
      }
    }
    return languagesClone;
  }

  // execute download zip by language key
  public generateLanguageZip(langKey: string) {
    const data = this.getLanguage(langKey);
    const emailsArray = [];

    for (const templateId in data.emails.templates) {
      const template = data.emails.templates[templateId];

      let thisHeader = data.emails.header.html;
      if (template.tags.customHeader) {
        if (!template.header.tags.empty) {
          thisHeader = template.header.html;
        }
      }

      const thisBody = template.html;

      let thisFooter = data.emails.footer.html;
      if (template.tags.customFooter) {
        if (!template.footer.tags.empty) {
          thisFooter = template.footer.html;
        }
      }

      emailsArray.push({
        fileName: template.name + ' [id ' + templateId + '] [' + data.key + '].html',
        content: thisHeader + thisBody + thisFooter
      });
    }

    const zip = this.jszip.setZip(emailsArray);
    this.jszip.saveAsZip(zip, 'emilio-generator [id ' + data.id + '] [' + data.key + '].zip');
  }

  // set sanitized src for iframe with email preview
  public setPreviewIframeContent(langKey: string) {

    this.previewSrc = '';
    this.previewData.refresh ++;

    const langId = this.getLanguage(langKey).id;

    let header = this.languages[langId].emails.header.html;
    if (this.languages[langId].emails.templates[this.previewData.id].tags.customHeader) {
      header = this.languages[langId].emails.templates[this.previewData.id].header.html;
    }

    const body = this.languages[langId].emails.templates[this.previewData.id].html;

    let footer = this.languages[langId].emails.footer.html;
    if (this.languages[langId].emails.templates[this.previewData.id].tags.customFooter) {
      footer = this.languages[langId].emails.templates[this.previewData.id].footer.html;
    }

    const iframeSrc = 'data:text/html;charset=utf-8,' +
      encodeURI('<html><head><body class="refresh-' + this.previewData.refresh + '"><style>body{margin: 0;}</style>') +
      encodeURI(header) + encodeURI(body) + encodeURI(footer) +
      encodeURI('</body></html>');

    this.previewSrc = this.sanitizer.bypassSecurityTrustResourceUrl(iframeSrc);
  }

  // get sanitized src for iframe with email preview
  public getPreviewIframeContent() {
    return this.previewSrc;
  }
}
