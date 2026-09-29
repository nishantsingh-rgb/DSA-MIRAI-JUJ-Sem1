#include <iostream>
using namespace std;

int main() {
    int totalSeconds = 9045;

    int hours = totalSeconds / 3600;
    int minutes = (totalSeconds % 3600) / 60;
    int seconds = totalSeconds % 60;

    cout << totalSeconds << " seconds = "
         << hours << "h " << minutes << "m " << seconds << "s" << endl;
    return 0;
}
