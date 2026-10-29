import { loadSiteLocale } from '../../config/siteLocale.ts'

export default loadSiteLocale(new URL('./site.yml', import.meta.url))
