import {
    v2 as cloudinary,
    UploadApiResponse,
    UploadApiErrorResponse,
} from 'cloudinary'
import { randomBytes } from 'crypto'
import { Injectable } from '@nestjs/common'
import toStream = require('buffer-to-stream')
import { ConfigService } from '@nestjs/config'

@Injectable()
export class CloudinaryService {
    constructor(private readonly configService: ConfigService) {
        cloudinary.config({
            api_key: this.configService.get<string>('cloudinary.apiKey'),
            cloud_name: this.configService.get<string>('cloudinary.cloudName'),
            api_secret: this.configService.get<string>('cloudinary.apiSecret'),
        })
    }

    async upload(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
        try {
            return new Promise((resolve, reject) => {
                const upload = cloudinary.uploader.upload_stream({
                    folder: 'OmegaLoan',
                    resource_type: 'image',
                    public_id: `OmegaLoan_${randomBytes(2).toString('hex')}_${new Date().toDateString().split(" ").join('-')}`
                }, (error, result) => {
                    if (error) return reject(error)
                    resolve(result)
                })

                toStream(file.buffer).pipe(upload)
            })
        } catch (err) {
            console.error(err)
        }
    }

    async delete(public_id: string) {
        return await cloudinary.uploader.destroy(public_id)
    }
}