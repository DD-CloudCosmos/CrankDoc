import type { BikeView } from '@/lib/garageBikes'
export function bikeFixture(overrides: Partial<BikeView> = {}): BikeView {
  return {id:'00000000-0000-4000-8000-000000000001',motorcycleId:null,
    nickname:'Weekend bike',make:'Honda',model:'Custom',year:null,variant:'',market:'',
    registration:'',mileageKm:null,archivedAt:null,photoPath:null,libraryImageUrl:null,
    modelReferenceUrl:null,...overrides}
}
