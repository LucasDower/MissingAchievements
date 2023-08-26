export default function Achievement(props: { title: string, description: string, percent: number, icon_url: string }) {
    return (
        <div className="flex flex-col">
            <div className="flex flex-row bg-zinc-700 items-center gap-4">
                <img width={64} height={64} loading="lazy" src={props.icon_url}></img>
                <div className="flex flex-col gap-1">
                    <div className='text-zinc-300 font-bold'>{props.title}</div>
                    <div className='text-zinc-400 text-xs'>{props.description}</div>
                </div>
            </div>
            <div style={{ width: `${props.percent}%` }} className="h-2 bg-blue-500">

            </div>
        </div>
    );
}