export default function Game(props: { handleClick: () => void, is_selected: boolean, has_achievements: boolean, title: string, icon_url: string }) {
    return !props.is_selected ? (
        <div onClick={props.handleClick} className="flex flex-row bg-zinc-700 cursor-pointer hover:bg-zinc-600 items-center gap-2 ">
            <img width={32} height={32} loading="lazy" src={props.icon_url}></img>
            <div className='text-zinc-300'>{props.title}</div>
        </div>
    ) : (
        <div onClick={props.handleClick} className="flex flex-row bg-blue-700 cursor-pointer hover:bg-blue-600 items-center gap-2 ">
            <img width={32} height={32} loading="lazy" src={props.icon_url}></img>
            <div className='text-blue-100'>{props.title}</div>
        </div>
    );
}