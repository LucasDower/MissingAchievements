import { ResponseData_AchievementsMeta } from "../../pages/api/achievements";

export default function AchievementStatus(props: { status: ResponseData_AchievementsMeta }) {
    const getDisplayMessage = () => {
        switch (props.status) {
            case 'Error':
                return 'Something went wrong';
            case 'UnlockedAll':
                return 'All achievements unlocked!'
            case 'AchivementsUnsupported':
                return 'This game does not support achievements';
        }
    }

    return (
        <div className="flex items-center h-full justify-center">
            { getDisplayMessage() }
        </div>
    );
}